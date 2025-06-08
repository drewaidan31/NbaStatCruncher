#!/usr/bin/env python3

import json
import psycopg2
import psycopg2.extras
import os
from datetime import datetime

def restore_player_data():
    """Restore complete player dataset from extended_players.json"""
    
    # Database connection
    conn = psycopg2.connect(os.environ['DATABASE_URL'])
    cur = conn.cursor()
    
    print("Loading extended player data...")
    with open('extended_players.json', 'r') as f:
        players_data = json.load(f)
    
    print(f"Found {len(players_data)} players to import")
    
    # Clear existing data
    cur.execute("DELETE FROM nba_players")
    print("Cleared existing player data")
    
    # Insert all players
    inserted_count = 0
    for player in players_data:
        try:
            # Get most recent season data
            latest_season = player['seasons'][0] if player['seasons'] else {}
            
            # Insert player
            cur.execute("""
                INSERT INTO nba_players (
                    id, name, team, position, games_played, minutes_per_game,
                    points, assists, rebounds, steals, blocks, turnovers,
                    field_goal_percentage, field_goal_attempts, three_point_percentage,
                    three_point_attempts, free_throw_percentage, plus_minus,
                    current_season, seasons, available_seasons
                ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
            """, (
                player['playerId'],
                player['name'],
                latest_season.get('team', ''),
                latest_season.get('position', ''),
                latest_season.get('gamesPlayed', 0),
                latest_season.get('minutesPerGame', 0.0),
                latest_season.get('points', 0.0),
                latest_season.get('assists', 0.0),
                latest_season.get('rebounds', 0.0),
                latest_season.get('steals', 0.0),
                latest_season.get('blocks', 0.0),
                latest_season.get('turnovers', 0.0),
                latest_season.get('fieldGoalPercentage', 0.0),
                latest_season.get('fieldGoalAttempts', 0.0),
                latest_season.get('threePointPercentage', 0.0),
                latest_season.get('threePointAttempts', 0.0),
                latest_season.get('freeThrowPercentage', 0.0),
                latest_season.get('plusMinus', 0.0),
                latest_season.get('season'),
                psycopg2.extras.Json(player['seasons']),
                psycopg2.extras.Json([s['season'] for s in player['seasons']])
            ))
            inserted_count += 1
            
            if inserted_count % 100 == 0:
                print(f"Inserted {inserted_count} players...")
                
        except Exception as e:
            print(f"Error inserting player {player['name']}: {e}")
            continue
    
    conn.commit()
    cur.close()
    conn.close()
    
    print(f"Successfully restored {inserted_count} players to database")
    return inserted_count

if __name__ == "__main__":
    restore_player_data()