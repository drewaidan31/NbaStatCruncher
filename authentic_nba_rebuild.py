#!/usr/bin/env python3
import psycopg2
import os
from nba_api.stats.endpoints import leagueleaders
import time

def get_db_connection():
    return psycopg2.connect(os.environ.get('DATABASE_URL'))

def insert_authentic_nba_players():
    """Insert only authentic NBA players with correct seasons"""
    conn = get_db_connection()
    cursor = conn.cursor()
    
    seasons = [
        '2023-24', '2022-23', '2021-22', '2020-21', '2019-20', '2018-19', '2017-18',
        '2016-17', '2015-16', '2014-15', '2013-14', '2012-13', '2011-12', '2010-11',
        '2009-10', '2008-09', '2007-08', '2006-07', '2005-06', '2004-05', '2003-04',
        '2002-03', '2001-02', '2000-01', '1999-00', '1998-99', '1997-98', '1996-97'
    ]
    
    total_inserted = 0
    
    for season in seasons:
        try:
            print(f'Loading {season}...')
            leaders = leagueleaders.LeagueLeaders(season=season)
            df = leaders.get_data_frames()[0]
            
            season_count = 0
            for _, player in df.iterrows():
                try:
                    cursor.execute('''
                        INSERT INTO nba_players (
                            player_id, name, team, position, games_played, minutes_per_game,
                            points, assists, rebounds, steals, blocks, turnovers,
                            field_goal_percentage, field_goal_attempts, three_point_percentage,
                            three_point_attempts, free_throw_percentage, free_throw_attempts,
                            plus_minus, win_percentage, current_season
                        ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                        ON CONFLICT (player_id, current_season) DO NOTHING
                    ''', (
                        int(player['PLAYER_ID']),
                        str(player['PLAYER']),
                        str(player['TEAM']),
                        'F',
                        int(player['GP']),
                        float(player['MIN']),
                        float(player['PTS']),
                        float(player['AST']),
                        float(player['REB']),
                        float(player['STL']),
                        float(player['BLK']),
                        float(player['TOV']),
                        float(player['FG_PCT']),
                        int(player['FGA']),
                        float(player['FG3_PCT']),
                        int(player['FG3A']),
                        float(player['FT_PCT']),
                        int(player['FTA']),
                        0.0,
                        0.5,
                        season
                    ))
                    season_count += 1
                    total_inserted += 1
                except Exception as e:
                    print(f'Error with {player.get("PLAYER", "Unknown")}: {e}')
            
            conn.commit()
            print(f'Added {season_count} players from {season}')
            time.sleep(0.6)  # API rate limiting
            
        except Exception as e:
            print(f'Error with season {season}: {e}')
            time.sleep(1)
    
    cursor.close()
    conn.close()
    
    print(f'Total authentic NBA players inserted: {total_inserted}')
    return total_inserted

if __name__ == "__main__":
    insert_authentic_nba_players()