"""
Alpha Engineer — Automated Reel Generator
Usage: python scripts/make_reel.py --reel 02

Workflow:
  1. Read reel config from reels/reel_config.json
  2. Generate 9:16 cinematic video via Higgsfield CLI (cinematic_studio_video_3_5)
  3. Generate voiceover via ElevenLabs API (if key set) or edge-tts fallback
  4. Combine video + audio via FFmpeg → reels/reel_0X_final.mp4

Credits: 80 per reel (cinematic_studio_video_3_5, 9:16, 1080p, 8s)
"""
import argparse
import asyncio
import json
import os
import shutil
import subprocess
import sys
import time
from pathlib import Path

import requests
from dotenv import load_dotenv

BASE_DIR = Path(__file__).parent.parent
load_dotenv(BASE_DIR / ".env")

REELS_DIR = BASE_DIR / "reels"
ELEVENLABS_API_KEY = os.getenv("ELEVENLABS_API_KEY")
ELEVENLABS_VOICE_ID = os.getenv("ELEVENLABS_VOICE_ID", "bIHbv24MWmeRgasZH58o")  # Will (warm male)
PEXELS_API_KEY = os.getenv("PEXELS_API_KEY")

_HF_CMD = shutil.which("higgsfield.cmd") or shutil.which("higgsfield") or "higgsfield"


# ── Higgsfield video generation ───────────────────────────────────────────────

def generate_higgsfield_video(prompt: str, genre: str, output_path: Path) -> bool:
    """Generate 9:16 cinematic video and save to output_path."""
    print(f"[Higgsfield] Generating cinematic 9:16 video (80 credits)...")
    print(f"  Prompt: {prompt[:80]}...")

    cmd = (
        f'"{_HF_CMD}" generate create cinematic_studio_video_3_5'
        f' --prompt "{prompt.replace(chr(34), chr(39))}"'
        f" --aspect_ratio 9:16"
        f" --resolution 1080p"
        f" --duration 8"
        f" --genre {genre}"
        f" --prompt_language en"
        f" --wait --wait-timeout 15m --json"
    )
    result = subprocess.run(cmd, capture_output=True, text=True, timeout=950, shell=True)

    if result.returncode != 0:
        print(f"[Higgsfield] Error: {result.stderr[:300]}")
        return False

    try:
        data = json.loads(result.stdout)
        job = data[0]
        if job.get("status") != "completed":
            print(f"[Higgsfield] Job status: {job.get('status')}")
            return False

        video_url = job.get("result_url")
        print(f"[Higgsfield] Downloading video...")
        resp = requests.get(video_url, stream=True, timeout=120)
        resp.raise_for_status()
        with open(output_path, "wb") as f:
            for chunk in resp.iter_content(8192):
                f.write(chunk)
        print(f"[Higgsfield] Video saved: {output_path.name}")
        return True

    except Exception as e:
        print(f"[Higgsfield] Exception: {e}")
        return False


# ── Pexels video fallback ─────────────────────────────────────────────────────

def generate_pexels_video(query: str, output_path: Path) -> bool:
    """Fallback: download a portrait stock video from Pexels (requires PEXELS_API_KEY)."""
    if not PEXELS_API_KEY:
        print("[Pexels] PEXELS_API_KEY not set in .env")
        return False
    print(f"[Pexels] Searching portrait video for: {query}")
    headers = {"Authorization": PEXELS_API_KEY}
    params = {"query": query, "per_page": 5, "orientation": "portrait"}
    try:
        resp = requests.get(
            "https://api.pexels.com/videos/search",
            headers=headers, params=params, timeout=30,
        )
        resp.raise_for_status()
        videos = resp.json().get("videos", [])
        if not videos:
            print("[Pexels] No videos found")
            return False

        video_url = None
        for video in videos:
            files = [
                f for f in video.get("video_files", [])
                if f.get("width") and f.get("height")
                and f["height"] >= f["width"]
                and min(f["width"], f["height"]) >= 720
            ]
            if files:
                files.sort(key=lambda f: f.get("height", 0))
                video_url = files[0]["link"]
                break

        if not video_url:
            print("[Pexels] No >=720p portrait file found")
            return False

        print("[Pexels] Downloading video...")
        dl = requests.get(video_url, stream=True, timeout=120)
        dl.raise_for_status()
        with open(output_path, "wb") as f:
            for chunk in dl.iter_content(8192):
                f.write(chunk)
        print(f"[Pexels] Video saved: {output_path.name}")
        return True

    except Exception as e:
        print(f"[Pexels] Error: {e}")
        return False


# ── Voiceover generation ──────────────────────────────────────────────────────

def generate_elevenlabs_voiceover(text: str, output_path: Path) -> bool:
    """Generate voiceover with ElevenLabs API (requires ELEVENLABS_API_KEY)."""
    print(f"[ElevenLabs] Generating voiceover (Roger voice)...")
    url = f"https://api.elevenlabs.io/v1/text-to-speech/{ELEVENLABS_VOICE_ID}"
    headers = {"xi-api-key": ELEVENLABS_API_KEY, "Content-Type": "application/json"}
    payload = {
        "text": text,
        "model_id": "eleven_turbo_v2_5",
        "voice_settings": {"stability": 0.5, "similarity_boost": 0.75, "style": 0.4},
    }
    try:
        resp = requests.post(url, headers=headers, json=payload, timeout=30)
        resp.raise_for_status()
        with open(output_path, "wb") as f:
            f.write(resp.content)
        print(f"[ElevenLabs] Voiceover saved: {output_path.name}")
        return True
    except Exception as e:
        print(f"[ElevenLabs] Error: {e}")
        return False


async def _edge_tts_async(text: str, path: Path, voice: str):
    import edge_tts
    await edge_tts.Communicate(text, voice).save(str(path))


def generate_edge_tts_voiceover(text: str, output_path: Path) -> bool:
    """Fallback: free edge-tts with Roger-style voice."""
    print(f"[edge-tts] Generating voiceover (en-US-RogerNeural fallback)...")
    try:
        asyncio.run(_edge_tts_async(text, output_path, "en-US-RogerNeural"))
        print(f"[edge-tts] Voiceover saved: {output_path.name}")
        return True
    except Exception as e:
        print(f"[edge-tts] Error: {e}")
        return False


def generate_voiceover(text: str, output_path: Path) -> bool:
    if ELEVENLABS_API_KEY:
        return generate_elevenlabs_voiceover(text, output_path)
    return generate_edge_tts_voiceover(text, output_path)


# ── FFmpeg combine ────────────────────────────────────────────────────────────

def combine_video_audio(video_path: Path, audio_path: Path, output_path: Path) -> bool:
    """Combine video + voiceover with FFmpeg. Audio loops/trims to video length."""
    print(f"[FFmpeg] Combining video + audio...")
    cmd = [
        "ffmpeg", "-y",
        "-i", str(video_path),
        "-i", str(audio_path),
        "-map", "0:v:0",
        "-map", "1:a:0",
        "-c:v", "copy",
        "-c:a", "aac",
        "-b:a", "192k",
        "-shortest",
        str(output_path),
    ]
    result = subprocess.run(cmd, capture_output=True, timeout=120)
    if result.returncode != 0:
        print(f"[FFmpeg] Error: {result.stderr.decode('utf-8', errors='replace')[-500:]}")
        return False
    print(f"[FFmpeg] Combined: {output_path.name}")
    return True


# ── Main ──────────────────────────────────────────────────────────────────────

def make_reel(reel_number: str, no_higgsfield: bool = False):
    config_path = REELS_DIR / "reel_config.json"
    if not config_path.exists():
        print(f"ERROR: {config_path} not found")
        sys.exit(1)

    configs = json.loads(config_path.read_text(encoding="utf-8"))
    reel = next((r for r in configs if r["number"] == reel_number), None)
    if not reel:
        print(f"ERROR: reel_{reel_number} not found in reel_config.json")
        sys.exit(1)

    print(f"\n=== Making Reel {reel_number}: {reel['theme']} ===")

    tmp_video = REELS_DIR / f"reel_{reel_number}_raw.mp4"
    tmp_audio = REELS_DIR / f"reel_{reel_number}_voiceover.mp3"
    final = REELS_DIR / f"reel_{reel_number}_final.mp4"

    # Step 1: Higgsfield video (Pexels fallback if it fails or --no-higgsfield)
    video_ok = False
    if not no_higgsfield:
        video_ok = generate_higgsfield_video(reel["higgsfield_prompt"], reel["genre"], tmp_video)
        if not video_ok:
            print("[Higgsfield] failed — falling back to Pexels")

    if not video_ok:
        pexels_query = reel["theme"].split("/")[0].strip()
        if not generate_pexels_video(pexels_query, tmp_video):
            print("ERROR: Both Higgsfield and Pexels video generation failed")
            sys.exit(1)

    # Step 2: Voiceover
    if not generate_voiceover(reel["voiceover"], tmp_audio):
        print("ERROR: Voiceover generation failed")
        sys.exit(1)

    # Step 3: Combine
    if not combine_video_audio(tmp_video, tmp_audio, final):
        print("ERROR: FFmpeg combine failed")
        sys.exit(1)

    # Clean up raw video (keep voiceover for reference)
    tmp_video.unlink(missing_ok=True)

    print(f"\n[DONE] Reel {reel_number} complete: {final}")
    preview = reel['caption'][:120].encode('ascii', errors='replace').decode('ascii')
    print(f"   Caption preview:\n{preview}...")
    if reel.get("affiliate_link"):
        print(f"   Affiliate link: {reel['affiliate_link']}")
    print(f"\nNext: Upload via GitHub Actions -> reel_number: {reel_number}")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Alpha Engineer Reel Generator")
    parser.add_argument("--reel", required=True, help="Reel number (e.g. 02, 03)")
    parser.add_argument("--no-higgsfield", action="store_true",
                        help="Skip Higgsfield and use Pexels stock video directly")
    args = parser.parse_args()

    reel_num = args.reel.zfill(2)
    make_reel(reel_num, no_higgsfield=args.no_higgsfield)
