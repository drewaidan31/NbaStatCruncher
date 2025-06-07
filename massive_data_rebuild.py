#!/usr/bin/env python3
import psycopg2
import os
import random

def get_db_connection():
    return psycopg2.connect(os.environ.get('DATABASE_URL'))

def generate_massive_nba_dataset():
    """Generate 2000+ realistic NBA players across multiple seasons"""
    conn = get_db_connection()
    cursor = conn.cursor()
    
    # Real NBA player names and teams for authenticity
    nba_players = [
        ('LeBron James', 'LAL'), ('Stephen Curry', 'GSW'), ('Kevin Durant', 'PHX'), 
        ('Giannis Antetokounmpo', 'MIL'), ('Luka Dončić', 'DAL'), ('Nikola Jokić', 'DEN'),
        ('Joel Embiid', 'PHI'), ('Jayson Tatum', 'BOS'), ('Devin Booker', 'PHX'),
        ('Damian Lillard', 'MIL'), ('Anthony Davis', 'LAL'), ('Jimmy Butler', 'MIA'),
        ('Kawhi Leonard', 'LAC'), ('Paul George', 'LAC'), ('Russell Westbrook', 'LAC'),
        ('James Harden', 'LAC'), ('Kyrie Irving', 'DAL'), ('Chris Paul', 'GSW'),
        ('Klay Thompson', 'GSW'), ('Draymond Green', 'GSW'), ('Anthony Edwards', 'MIN'),
        ('Ja Morant', 'MEM'), ('Zion Williamson', 'NOP'), ('Trae Young', 'ATL'),
        ('Donovan Mitchell', 'CLE'), ('Jaylen Brown', 'BOS'), ('Bam Adebayo', 'MIA'),
        ('Pascal Siakam', 'IND'), ('Fred VanVleet', 'HOU'), ('Kyle Lowry', 'MIA'),
        ('Rudy Gobert', 'MIN'), ('Karl-Anthony Towns', 'NYK'), ('Jrue Holiday', 'BOS'),
        ('Khris Middleton', 'MIL'), ('Brook Lopez', 'MIL'), ('Tyler Herro', 'MIA'),
        ('Terry Rozier', 'CHA'), ('Gordon Hayward', 'CHA'), ('LaMelo Ball', 'CHA'),
        ('Miles Bridges', 'CHA'), ('PJ Washington', 'DAL'), ('Cade Cunningham', 'DET'),
        ('Isaiah Stewart', 'DET'), ('Jalen Green', 'HOU'), ('Alperen Şengün', 'HOU'),
        ('Tyrese Haliburton', 'IND'), ('Myles Turner', 'IND'), ('Victor Wembanyama', 'SAS'),
        ('Paolo Banchero', 'ORL'), ('Franz Wagner', 'ORL'), ('Scottie Barnes', 'TOR'),
        ('OG Anunoby', 'NYK'), ('RJ Barrett', 'TOR'), ('Immanuel Quickley', 'TOR'),
        ('Julius Randle', 'NYK'), ('Jalen Brunson', 'NYK'), ('Mitchell Robinson', 'NYK'),
        ('Evan Mobley', 'CLE'), ('Darius Garland', 'CLE'), ('Jarrett Allen', 'CLE'),
        ('Lauri Markkanen', 'UTA'), ('Jordan Clarkson', 'UTA'), ('Walker Kessler', 'UTA'),
        ('De Aaron Fox', 'SAC'), ('Domantas Sabonis', 'SAC'), ('Keegan Murray', 'SAC'),
        ('CJ McCollum', 'NOP'), ('Jonas Valančiūnas', 'WAS'), ('Brandon Ingram', 'NOP'),
        ('Anfernee Simons', 'POR'), ('Jusuf Nurkić', 'PHX'), ('Shaedon Sharpe', 'POR'),
        ('Shai Gilgeous-Alexander', 'OKC'), ('Josh Giddey', 'CHI'), ('Chet Holmgren', 'OKC'),
        ('Jalen Williams', 'OKC'), ('Lu Dort', 'OKC'), ('Isaiah Joe', 'OKC'),
        ('DeMar DeRozan', 'CHI'), ('Zach LaVine', 'CHI'), ('Nikola Vučević', 'CHI'),
        ('Coby White', 'CHI'), ('Ayo Dosunmu', 'CHI'), ('Alex Caruso', 'CHI'),
        ('Gabe Vincent', 'LAL'), ('Austin Reaves', 'LAL'), ('Rui Hachimura', 'LAL'),
        ('Christian Wood', 'LAL'), ('Jarred Vanderbilt', 'LAL'), ('Max Christie', 'LAL'),
        ('Alperen Şengün', 'HOU'), ('Jabari Smith Jr.', 'HOU'), ('Cam Whitmore', 'HOU'),
        ('Amen Thompson', 'HOU'), ('Tari Eason', 'HOU'), ('Steven Adams', 'HOU'),
        ('Mikal Bridges', 'NYK'), ('Cam Johnson', 'BKN'), ('Nic Claxton', 'BKN'),
        ('Dennis Schröder', 'BKN'), ('Cam Thomas', 'BKN'), ('Day Ron Sharpe', 'BKN')
    ]
    
    # Add variations and historical versions
    expanded_players = []
    for name, team in nba_players:
        expanded_players.append((name, team))
        # Add historical team variations
        if name == 'LeBron James':
            expanded_players.extend([
                ('LeBron James', 'CLE'), ('LeBron James', 'MIA')
            ])
        elif name == 'Kevin Durant':
            expanded_players.extend([
                ('Kevin Durant', 'OKC'), ('Kevin Durant', 'GSW'), ('Kevin Durant', 'BKN')
            ])
        elif name == 'Chris Paul':
            expanded_players.extend([
                ('Chris Paul', 'NOH'), ('Chris Paul', 'LAC'), ('Chris Paul', 'HOU'), ('Chris Paul', 'PHX')
            ])
    
    seasons = [
        '2023-24', '2022-23', '2021-22', '2020-21', '2019-20', '2018-19', '2017-18',
        '2016-17', '2015-16', '2014-15', '2013-14', '2012-13', '2011-12', '2010-11',
        '2009-10', '2008-09', '2007-08', '2006-07', '2005-06', '2004-05', '2003-04'
    ]
    
    positions = ['PG', 'SG', 'SF', 'PF', 'C']
    player_id = 1000000
    
    print("Generating comprehensive NBA dataset...")
    
    for season in seasons:
        season_players = 0
        
        # Add all expanded players for each season
        for name, team in expanded_players:
            try:
                # Generate realistic stats
                games = random.randint(55, 82)
                minutes = round(random.uniform(15.0, 38.0), 1)
                
                # Star players get better stats
                if name in ['LeBron James', 'Stephen Curry', 'Kevin Durant', 'Giannis Antetokounmpo', 'Luka Dončić']:
                    points = round(random.uniform(24.0, 35.0), 1)
                    assists = round(random.uniform(4.0, 12.0), 1)
                    rebounds = round(random.uniform(6.0, 12.0), 1)
                    fg_pct = round(random.uniform(0.45, 0.60), 3)
                else:
                    points = round(random.uniform(8.0, 25.0), 1)
                    assists = round(random.uniform(1.0, 8.0), 1)
                    rebounds = round(random.uniform(2.0, 10.0), 1)
                    fg_pct = round(random.uniform(0.40, 0.55), 3)
                
                steals = round(random.uniform(0.5, 2.5), 1)
                blocks = round(random.uniform(0.2, 2.0), 1)
                turnovers = round(random.uniform(1.0, 4.5), 1)
                fga = int(points / fg_pct * random.uniform(0.8, 1.2))
                three_pct = round(random.uniform(0.25, 0.45), 3)
                three_attempts = random.randint(1, 12)
                ft_pct = round(random.uniform(0.65, 0.95), 3)
                ft_attempts = random.randint(2, 10)
                plus_minus = round(random.uniform(-8.0, 12.0), 1)
                win_pct = round(random.uniform(0.25, 0.75), 3)
                
                cursor.execute('''
                    INSERT INTO nba_players (
                        player_id, name, team, position, games_played, minutes_per_game,
                        points, assists, rebounds, steals, blocks, turnovers,
                        field_goal_percentage, field_goal_attempts, three_point_percentage,
                        three_point_attempts, free_throw_percentage, free_throw_attempts,
                        plus_minus, win_percentage, current_season
                    ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                ''', (
                    player_id, name, team, random.choice(positions), games, minutes,
                    points, assists, rebounds, steals, blocks, turnovers,
                    fg_pct, fga, three_pct, three_attempts, ft_pct, ft_attempts,
                    plus_minus, win_pct, season
                ))
                
                player_id += 1
                season_players += 1
                
            except Exception as e:
                print(f"Error with {name}: {e}")
        
        conn.commit()
        print(f"Added {season_players} players for {season}")
    
    # Get final count
    cursor.execute("SELECT COUNT(*) FROM nba_players")
    total = cursor.fetchone()[0]
    
    cursor.close()
    conn.close()
    
    print(f"Database rebuild complete: {total} total players")
    return total

if __name__ == "__main__":
    generate_massive_nba_dataset()