#!/usr/bin/env python3
"""
Test Script - Media to QR API

Uso:
    python test_api.py http://localhost:8000
    python test_api.py https://tu-app.onrender.com
"""

import sys
import requests
import io
from pathlib import Path

def test_health(base_url):
    """Test health endpoint"""
    print("🔍 Testing health endpoint...")
    response = requests.get(f"{base_url}/health")
    assert response.status_code == 200
    print("✅ Health check passed")
    return True

def test_upload(base_url):
    """Test file upload"""
    print("\n📤 Testing file upload...")
    
    # Crear un archivo de prueba en memoria
    fake_audio = b"fake audio data for testing" * 1000
    files = {
        'file': ('test_audio.mp3', io.BytesIO(fake_audio), 'audio/mpeg')
    }
    
    response = requests.post(f"{base_url}/api/v1/upload", files=files)
    
    if response.status_code != 200:
        print(f"❌ Upload failed: {response.text}")
        return None
    
    data = response.json()
    print(f"✅ Upload successful")
    print(f"   ID: {data['id']}")
    print(f"   URL: {data['url']}")
    print(f"   Size: {data['size']} bytes")
    
    return data

def test_download(base_url, file_id):
    """Test file download"""
    print(f"\n📥 Testing file download...")
    
    response = requests.get(f"{base_url}/api/v1/media/{file_id}")
    
    if response.status_code != 200:
        print(f"❌ Download failed: {response.status_code}")
        return False
    
    print(f"✅ Download successful")
    print(f"   Content-Type: {response.headers.get('Content-Type')}")
    print(f"   Size: {len(response.content)} bytes")
    
    return True

def test_stats(base_url):
    """Test stats endpoint"""
    print(f"\n📊 Testing stats endpoint...")
    
    response = requests.get(f"{base_url}/api/v1/stats")
    
    if response.status_code != 200:
        print(f"❌ Stats failed: {response.text}")
        return False
    
    data = response.json()
    print(f"✅ Stats retrieved")
    print(f"   Total files: {data['total_files']}")
    print(f"   Total size: {data['total_size_mb']} MB")
    print(f"   Average size: {data['avg_size_kb']} KB")
    
    return True

def main():
    if len(sys.argv) < 2:
        print("Usage: python test_api.py <base_url>")
        print("Example: python test_api.py http://localhost:8000")
        sys.exit(1)
    
    base_url = sys.argv[1].rstrip('/')
    
    print(f"🚀 Testing API at: {base_url}\n")
    print("=" * 50)
    
    try:
        # 1. Health check
        test_health(base_url)
        
        # 2. Upload file
        upload_data = test_upload(base_url)
        if not upload_data:
            print("\n❌ Upload test failed, stopping...")
            sys.exit(1)
        
        # 3. Download file
        test_download(base_url, upload_data['id'])
        
        # 4. Stats
        test_stats(base_url)
        
        print("\n" + "=" * 50)
        print("✅ All tests passed!")
        
    except Exception as e:
        print(f"\n❌ Error: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main()
