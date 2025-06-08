#!/usr/bin/env python3

import json
import psycopg2
import os

def quick_restore():
    """Quick restore of player data without complex array handling"""
    
    conn = psycopg2.connect(os.environ['DATABASE_URL'])
    cur = conn.cursor()
    
    print("Loading player data...")
    with open('extended_players.json', 'r') as f:
        players_data = json.load(f)
    
    print(f"Found {len(players_data)} players")
    
    # Clear existing data
    cur.execute("DELETE FROM nba_players")
    
    # Insert players with simplified data
    inserted = 0
    for player in players_data:
        try:
            latest = player['seasons'][0] if player['seasons'] else {}
            
            cur.execute("""
                INSERT INTO nba_players (
                    id, name, team, position, games_played, minutes_per_game,
                    points, assists, rebounds, steals, blocks, turnovers,
                    field_goal_percentage, field_goal_attempts, three_point_percentage,
                    three_point_attempts, free_throw_percentage, plus_minus,
                    current_season
                ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
            """, (
                player['playerId'],
                player['name'],
                latest.get('team', ''),
                latest.get('position', ''),
                latest.get('gamesPlayed', 0),
                latest.get('minutesPerGame', 0.0),
                latest.get('points', 0.0),
                latest.get('assists', 0.0),
                latest.get('rebounds', 0.0),
                latest.get('steals', 0.0),
                latest.get('blocks', 0.0),
                latest.get('turnovers', 0.0),
                latest.get('fieldGoalPercentage', 0.0),
                latest.get('fieldGoalAttempts', 0.0),
                latest.get('threePointPercentage', 0.0),
                latest.get('threePointAttempts', 0.0),
                latest.get('freeThrowPercentage', 0.0),
                latest.get('plusMinus', 0.0),
                latest.get('season')
            ))
            inserted += 1
            
        except Exception as e:
            print(f"Error with {player['name']}: {e}")
            continue
    
    conn.commit()
    cur.close()
    conn.close()
    
    print(f"Restored {inserted} players")
    return inserted

if __name__ == "__main__":
    quick_restore()