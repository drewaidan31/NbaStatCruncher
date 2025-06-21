#!/usr/bin/env python3
"""
Calculate and populate FGM (Field Goals Made) and 3PM (Three Pointers Made) 
for all players in the database using existing percentage and attempt data.
"""

import os
import psycopg2
from psycopg2.extras import RealDictCursor

def get_db_connection():
    """Get database connection using environment variable"""
    database_url = os.getenv('DATABASE_URL')
    if not database_url:
        raise ValueError("DATABASE_URL environment variable not set")
    return psycopg2.connect(database_url)

def calculate_and_update_made_stats():
    """Calculate FGM and 3PM for all players and update the database"""
    
    try:
        conn = get_db_connection()
        cursor = conn.cursor(cursor_factory=RealDictCursor)
        
        # Get all players with their current stats
        cursor.execute("""
            SELECT id, field_goal_attempts, field_goal_percentage, 
                   three_point_attempts, three_point_percentage
            FROM nba_players
        """)
        
        players = cursor.fetchall()
        print(f"Processing {len(players)} players...")
        
        updated_count = 0
        
        for player in players:
            # Calculate Field Goals Made: FGM = FGA * FG_PCT / 100
            fga = player['field_goal_attempts'] or 0
            fg_pct = player['field_goal_percentage'] or 0
            fgm = (fga * fg_pct / 100) if fga > 0 and fg_pct > 0 else 0
            
            # Calculate Three Pointers Made: 3PM = 3PA * 3P_PCT / 100
            three_pa = player['three_point_attempts'] or 0
            three_pct = player['three_point_percentage'] or 0
            three_pm = (three_pa * three_pct / 100) if three_pa > 0 and three_pct > 0 else 0
            
            # Update the player record
            cursor.execute("""
                UPDATE nba_players 
                SET field_goals_made = %s, three_pointers_made = %s
                WHERE id = %s
            """, (round(fgm, 1), round(three_pm, 1), player['id']))
            
            updated_count += 1
            
            if updated_count % 100 == 0:
                print(f"Updated {updated_count} players...")
        
        # Commit all changes
        conn.commit()
        print(f"Successfully updated {updated_count} players with FGM and 3PM values")
        
        # Verify the update with a sample
        cursor.execute("""
            SELECT name, field_goal_attempts, field_goal_percentage, field_goals_made,
                   three_point_attempts, three_point_percentage, three_pointers_made
            FROM nba_players 
            WHERE field_goals_made > 0 
            LIMIT 5
        """)
        
        samples = cursor.fetchall()
        print("\nSample verification:")
        for sample in samples:
            print(f"{sample['name']}: FGA={sample['field_goal_attempts']}, FG%={sample['field_goal_percentage']}, FGM={sample['field_goals_made']}")
        
    except Exception as e:
        print(f"Error updating made stats: {e}")
        if conn:
            conn.rollback()
    finally:
        if cursor:
            cursor.close()
        if conn:
            conn.close()

if __name__ == "__main__":
    calculate_and_update_made_stats()