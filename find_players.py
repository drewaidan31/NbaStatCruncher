#!/usr/bin/env python3
import requests
import json

try:
    response = requests.get('http://localhost:5000/api/players')
    players = response.json()
    
    target_names = ['daniels', 'castle', 'pritchard']
    
    for player in players:
        name_lower = player['name'].lower()
        for target in target_names:
            if target in name_lower:
                print(f"Found: {player['playerId']},{player['name']},{player['team']}")
                
except Exception as e:
    print(f"Error: {e}")