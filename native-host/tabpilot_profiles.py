#!/usr/bin/env python3
"""TabPilot Native Messaging Host - Chrome Profile Manager"""
import sys
import json
import struct
import os
import subprocess
import platform


def read_message():
    raw_length = sys.stdin.buffer.read(4)
    if len(raw_length) == 0:
        sys.exit(0)
    message_length = struct.unpack('<I', raw_length)[0]
    message = sys.stdin.buffer.read(message_length).decode('utf-8')
    return json.loads(message)


def send_message(message):
    encoded = json.dumps(message).encode('utf-8')
    sys.stdout.buffer.write(struct.pack('<I', len(encoded)))
    sys.stdout.buffer.write(encoded)
    sys.stdout.buffer.flush()


def get_local_state_path():
    system = platform.system()
    if system == 'Darwin':
        return os.path.expanduser(
            '~/Library/Application Support/Google/Chrome/Local State'
        )
    elif system == 'Linux':
        return os.path.expanduser('~/.config/google-chrome/Local State')
    elif system == 'Windows':
        return os.path.join(
            os.environ.get('LOCALAPPDATA', ''),
            'Google', 'Chrome', 'User Data', 'Local State'
        )
    return None


def get_chrome_profiles():
    local_state_path = get_local_state_path()
    if not local_state_path or not os.path.exists(local_state_path):
        return {'error': 'Chrome Local State file not found'}

    try:
        with open(local_state_path, 'r') as f:
            local_state = json.load(f)
    except (json.JSONDecodeError, IOError) as e:
        return {'error': f'Failed to read Local State: {e}'}

    info_cache = local_state.get('profile', {}).get('info_cache', {})
    profiles = []
    for dir_name, info in info_cache.items():
        profiles.append({
            'directory': dir_name,
            'name': info.get('name', dir_name),
            'shortcutName': info.get('shortcut_name', ''),
            'gaiaName': info.get('gaia_name', ''),
            'userName': info.get('user_name', ''),
            'isUsingDefaultName': info.get('is_using_default_name', True),
        })

    profiles.sort(key=lambda p: (p['directory'] != 'Default', p['name'].lower()))
    return {'profiles': profiles}


def switch_profile(profile_directory):
    system = platform.system()
    try:
        if system == 'Darwin':
            subprocess.Popen([
                'open', '-na', 'Google Chrome',
                '--args', f'--profile-directory={profile_directory}'
            ])
        elif system == 'Linux':
            subprocess.Popen([
                'google-chrome', f'--profile-directory={profile_directory}'
            ])
        elif system == 'Windows':
            chrome_path = os.path.join(
                os.environ.get('PROGRAMFILES', ''),
                'Google', 'Chrome', 'Application', 'chrome.exe'
            )
            subprocess.Popen([
                chrome_path, f'--profile-directory={profile_directory}'
            ])
        else:
            return {'error': f'Unsupported platform: {system}'}
        return {'success': True, 'profile': profile_directory}
    except Exception as e:
        return {'error': f'Failed to launch Chrome: {e}'}


def main():
    message = read_message()
    action = message.get('action')

    if action == 'ping':
        response = {'status': 'ok', 'version': '1.0.0'}
    elif action == 'get-profiles':
        response = get_chrome_profiles()
    elif action == 'switch-profile':
        profile_dir = message.get('profileDirectory')
        if not profile_dir:
            response = {'error': 'Missing profileDirectory'}
        else:
            response = switch_profile(profile_dir)
    else:
        response = {'error': f'Unknown action: {action}'}

    send_message(response)


if __name__ == '__main__':
    main()
