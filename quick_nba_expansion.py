#!/usr/bin/env python3

import os
import psycopg2
from nba_api.stats.endpoints import leagueleaders
import pandas as pd
import time

def get_db_connection():
    database_url = os.environ.get('DATABASE_URL')
    return psycopg2.connect(database_url)

def get_season_leaders(season):
    try:
        leaders = leagueleaders.LeagueLeaders(season=season, season_type_all_star='Regular Season')
        df = leaders.get_data_frames()[0]
        return df.head(100)  # Top 100 per season
    except Exception as e:
        print(f"Error fetching {season}: {e}")
        return pd.DataFrame()

def add_unique_players(players_df, season, conn):
    cursor = conn.cursor()
    added_count = 0
    
    for _, player in players_df.iterrows():
        try:
            player_id = int(player.get('PLAYER_ID', 0))
            
            # Check if player already exists
            cursor.execute("SELECT COUNT(*) FROM nba_players WHERE player_id = %s", (player_id,))
            if cursor.fetchone()[0] > 0:
                continue  # Skip existing players
            
            # Insert new player
            cursor.execute("""
                INSERT INTO nba_players (
                    player_id, name, team, position, games_played, minutes_per_game,
                    points, assists, rebounds, steals, blocks, turnovers,
                    field_goal_percentage, field_goal_attempts, three_point_percentage,
                    three_point_attempts, free_throw_percentage, free_throw_attempts,
                    plus_minus, win_percentage, current_season
                ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
            """, (
                player_id,
                str(player.get('PLAYER', '')),
                str(player.get('TEAM_ABBREVIATION', '')),
                '',
                int(player.get('GP', 0)),
                float(player.get('MIN', 0)),
                float(player.get('PTS', 0)),
                float(player.get('AST', 0)),
                float(player.get('REB', 0)),
                float(player.get('STL', 0)),
                float(player.get('BLK', 0)),
                float(player.get('TOV', 0)),
                float(player.get('FG_PCT', 0)),
                float(player.get('FGA', 0)),
                float(player.get('FG3_PCT', 0)),
                float(player.get('FG3A', 0)),
                float(player.get('FT_PCT', 0)),
                float(player.get('FTA', 0)),
                float(player.get('PLUS_MINUS', 0)),
                0.5,
                season
            ))
            added_count += 1
            
        except Exception as e:
            print(f"Error adding {player.get('PLAYER', 'Unknown')}: {e}")
            continue
    
    conn.commit()
    cursor.close()
    return added_count

def main():
    # Focus on recent seasons with most data
    seasons = ['2022-23', '2021-22', '2020-21', '2019-20', '2018-19', '2017-18', '2016-17', '2015-16']
    
    conn = get_db_connection()
    total_added = 0
    
    print(f"Adding unique players from {len(seasons)} seasons...")
    
    for season in seasons:
        try:
            leaders_df = get_season_leaders(season)
            if not leaders_df.empty:
                added = add_unique_players(leaders_df, season, conn)
                total_added += added
                print(f"Added {added} new players from {season} (Total: {total_added})")
            
            time.sleep(0.6)
            
        except Exception as e:
            print(f"Error processing {season}: {e}")
            continue
    
    conn.close()
    print(f"\nTotal unique players added: {total_added}")

if __name__ == "__main__":
    main()