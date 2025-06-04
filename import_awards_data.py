#!/usr/bin/env python3
import csv
import os
import psycopg2
from psycopg2.extras import execute_values

def get_db_connection():
    """Get database connection using environment variable"""
    return psycopg2.connect(os.environ['DATABASE_URL'])

def import_player_awards():
    """Import player awards data from CSV"""
    print("Importing player awards data...")
    
    with get_db_connection() as conn:
        with conn.cursor() as cur:
            # Clear existing data
            cur.execute("DELETE FROM player_awards")
            
            awards_data = []
            with open('attached_assets/Player Award Shares.csv', 'r') as f:
                reader = csv.DictReader(f)
                for row in reader:
                    awards_data.append((
                        int(row['player_id']) if row['player_id'] else None,
                        row['player'],
                        row['season'],
                        row['award'],
                        row['winner'],
                        float(row['share']) if row['share'] else None,
                        float(row['pts_won']) if row['pts_won'] else None,
                        float(row['pts_max']) if row['pts_max'] else None,
                        float(row['first']) if row['first'] else None,
                        row['tm'],
                        int(row['age']) if row['age'] else None
                    ))
            
            # Insert awards data
            execute_values(
                cur,
                """INSERT INTO player_awards 
                   (player_id, player_name, season, award, winner, share, pts_won, pts_max, first, team, age)
                   VALUES %s""",
                awards_data
            )
            
            print(f"Imported {len(awards_data)} player award records")

def import_all_star_selections():
    """Import All-Star selections data from CSV"""
    print("Importing All-Star selections data...")
    
    with get_db_connection() as conn:
        with conn.cursor() as cur:
            # Clear existing data
            cur.execute("DELETE FROM all_star_selections")
            
            allstar_data = []
            with open('attached_assets/All-Star Selections.csv', 'r') as f:
                reader = csv.DictReader(f)
                for row in reader:
                    allstar_data.append((
                        row['player'],
                        row['team'],
                        row['lg'],  # This appears to be conference/league
                        row['season'],
                        row['replaced']
                    ))
            
            # Insert All-Star data
            execute_values(
                cur,
                """INSERT INTO all_star_selections 
                   (player_name, team, conference, season, replaced)
                   VALUES %s""",
                allstar_data
            )
            
            print(f"Imported {len(allstar_data)} All-Star selection records")

def import_end_of_season_teams():
    """Import end of season teams data from CSV"""
    print("Importing end of season teams data...")
    
    with get_db_connection() as conn:
        with conn.cursor() as cur:
            # Clear existing data
            cur.execute("DELETE FROM end_of_season_teams")
            
            teams_data = []
            with open('attached_assets/End of Season Teams (Voting).csv', 'r') as f:
                reader = csv.DictReader(f)
                for row in reader:
                    # Map the CSV column names to our schema
                    teams_data.append((
                        row['season'],
                        row['type'],
                        row['number_tm'],  # This is the team (1st, 2nd, 3rd, etc.)
                        row['position'] if row['position'] != 'NA' else None,
                        row['player'],
                        int(row['age']) if row['age'] else None,
                        row['tm'],
                        int(row['pts_won']) if row['pts_won'] else None,
                        int(row['pts_max']) if row['pts_max'] else None,
                        float(row['share']) if row['share'] else None
                    ))
            
            # Insert teams data
            execute_values(
                cur,
                """INSERT INTO end_of_season_teams 
                   (season, type, team, position, player_name, age, team_abbr, pts_won, pts_max, share)
                   VALUES %s""",
                teams_data
            )
            
            print(f"Imported {len(teams_data)} end of season team records")

def main():
    """Import all awards data"""
    try:
        import_player_awards()
        import_all_star_selections()
        import_end_of_season_teams()
        print("Successfully imported all awards data!")
        
        # Print some statistics
        with get_db_connection() as conn:
            with conn.cursor() as cur:
                cur.execute("SELECT COUNT(*) FROM player_awards")
                award_count = cur.fetchone()[0]
                
                cur.execute("SELECT COUNT(*) FROM all_star_selections")
                allstar_count = cur.fetchone()[0]
                
                cur.execute("SELECT COUNT(*) FROM end_of_season_teams")
                teams_count = cur.fetchone()[0]
                
                print(f"\nDatabase statistics:")
                print(f"Player awards: {award_count}")
                print(f"All-Star selections: {allstar_count}")
                print(f"End of season teams: {teams_count}")
                
    except Exception as e:
        print(f"Error importing awards data: {e}")
        raise

if __name__ == "__main__":
    main()