// Comprehensive NBA player position database for accurate historical position data
// This replaces the flawed database positions with accurate NBA position information

interface PlayerPositionData {
  [key: string]: string;
}

export const NBA_PLAYER_POSITIONS: PlayerPositionData = {
  // Centers
  "Patrick Ewing": "C",
  "Hakeem Olajuwon": "C", 
  "David Robinson": "C",
  "Shaquille O'Neal": "C",
  "Dikembe Mutombo": "C",
  "Alonzo Mourning": "C",
  "Arvydas Sabonis": "C",
  "Brad Daugherty": "C",
  "Vlade Divac": "C",
  "Rik Smits": "C",
  "Gheorghe Muresan": "C",
  "Mark Eaton": "C",
  "Joel Embiid": "C",
  "Nikola Jokić": "C",
  "Anthony Davis": "PF/C",
  "Karl-Anthony Towns": "C",
  "Rudy Gobert": "C",
  "Bam Adebayo": "C",
  "Jusuf Nurkić": "C",
  "Clint Capela": "C",
  "Nikola Vučević": "C",
  "Hassan Whiteside": "C",
  "Dwight Howard": "C",
  "Andre Drummond": "C",
  "DeAndre Jordan": "C",
  "Steven Adams": "C",
  "Myles Turner": "C",
  "Brook Lopez": "C",
  "Al Horford": "C",
  "Jonas Valančiūnas": "C",

  // Power Forwards
  "Karl Malone": "PF",
  "Charles Barkley": "PF",
  "Dennis Rodman": "PF",
  "Tim Duncan": "PF/C",
  "Kevin Garnett": "PF",
  "Dirk Nowitzki": "PF",
  "Chris Webber": "PF",
  "Rasheed Wallace": "PF",
  "Tom Gugliotta": "PF",
  "Horace Grant": "PF",
  "Shawn Kemp": "PF",
  "Derrick Coleman": "PF",
  "Larry Johnson": "PF",
  "Christian Laettner": "PF",
  "Otis Thorpe": "PF",
  "Dale Davis": "PF",
  "Antonio McDyess": "PF",
  "Giannis Antetokounmpo": "PF",
  "Pascal Siakam": "PF",
  "Julius Randle": "PF",
  "Draymond Green": "PF",
  "Kristaps Porziņģis": "PF/C",
  "Jayson Tatum": "SF/PF",
  "Paolo Banchero": "PF",
  "Evan Mobley": "PF/C",
  "Jaren Jackson Jr.": "PF/C",
  "John Collins": "PF",
  "Lauri Markkanen": "PF",

  // Small Forwards  
  "Scottie Pippen": "SF",
  "Grant Hill": "SF",
  "Glen Rice": "SF",
  "Detlef Schrempf": "SF",
  "Chris Mullin": "SF",
  "Dominique Wilkins": "SF",
  "Sean Elliott": "SF",
  "Danny Manning": "SF",
  "Cedric Ceballos": "SF",
  "Jamal Mashburn": "SF",
  "LeBron James": "SF",
  "Kevin Durant": "SF/PF",
  "Kawhi Leonard": "SF",
  "Paul George": "SF",
  "Jimmy Butler": "SF/SG",
  "Jaylen Brown": "SF",
  "DeMar DeRozan": "SG/SF",
  "Gordon Hayward": "SF",
  "Khris Middleton": "SF",
  "Harrison Barnes": "SF",
  "Otto Porter Jr.": "SF",
  "Bojan Bogdanović": "SF",
  "Kelly Oubre Jr.": "SF",

  // Shooting Guards
  "Michael Jordan": "SG",
  "Kobe Bryant": "SG", 
  "Clyde Drexler": "SG",
  "Reggie Miller": "SG",
  "Mitch Richmond": "SG",
  "Joe Dumars": "SG",
  "Dan Majerle": "SG",
  "Hersey Hawkins": "SG",
  "Dale Ellis": "SG",
  "Jeff Hornacek": "SG",
  "Steve Smith": "SG",
  "Kendall Gill": "SG",
  "Allan Houston": "SG",
  "Ray Allen": "SG",
  "Vince Carter": "SG/SF",
  "Tracy McGrady": "SG/SF",
  "James Harden": "SG",
  "Devin Booker": "SG",
  "Donovan Mitchell": "SG",
  "Zach LaVine": "SG",
  "Bradley Beal": "SG",
  "CJ McCollum": "SG",
  "Tyler Herro": "SG",
  "Jordan Poole": "SG",
  "Malik Monk": "SG",
  "Anfernee Simons": "SG",

  // Point Guards
  "John Stockton": "PG",
  "Magic Johnson": "PG",
  "Isiah Thomas": "PG",
  "Mark Jackson": "PG", 
  "Tim Hardaway": "PG",
  "Kevin Johnson": "PG",
  "Gary Payton": "PG",
  "Penny Hardaway": "PG",
  "Rod Strickland": "PG",
  "Terrell Brandon": "PG",
  "Damon Stoudamire": "PG",
  "Steve Nash": "PG",
  "Jason Kidd": "PG",
  "Chris Paul": "PG",
  "Stephen Curry": "PG",
  "Russell Westbrook": "PG",
  "Damian Lillard": "PG",
  "Kyrie Irving": "PG",
  "Ja Morant": "PG",
  "Trae Young": "PG",
  "Luka Dončić": "PG",
  "De'Aaron Fox": "PG",
  "Tyrese Haliburton": "PG",
  "Fred VanVleet": "PG",
  "Mike Conley": "PG",
  "Kyle Lowry": "PG",
  "Terry Rozier": "PG",
  "Kemba Walker": "PG",
  "Jrue Holiday": "PG/SG",
  "Marcus Smart": "PG/SG",
  "Derrick White": "PG/SG",

  // Multi-position players
  "Magic Johnson": "PG",
  "LeBron James": "SF", 
  "Ben Simmons": "PG/PF",
  "Draymond Green": "PF",
  "Bam Adebayo": "C",
  "Anthony Davis": "PF/C",
  "Kevin Durant": "SF",
  "Giannis Antetokounmpo": "PF",
  "Jimmy Butler": "SF",
  "Paul George": "SF",
  "Kawhi Leonard": "SF"
};

export function getPlayerPosition(playerName: string): string {
  // Clean player name for better matching
  const cleanName = playerName.replace(/['']/g, "'").trim();
  
  // Direct lookup
  if (NBA_PLAYER_POSITIONS[cleanName]) {
    return NBA_PLAYER_POSITIONS[cleanName];
  }
  
  // Try partial matching for names that might have different formatting
  const normalizedName = cleanName.toLowerCase();
  
  for (const [name, position] of Object.entries(NBA_PLAYER_POSITIONS)) {
    const normalizedDbName = name.toLowerCase();
    
    // Check if the database name contains the lookup name or vice versa
    if (normalizedDbName.includes(normalizedName) || normalizedName.includes(normalizedDbName)) {
      return position;
    }
    
    // Check for last name matches for common cases
    const lastName = normalizedName.split(' ').pop() || '';
    const dbLastName = normalizedDbName.split(' ').pop() || '';
    
    if (lastName.length > 3 && dbLastName.length > 3 && lastName === dbLastName) {
      return position;
    }
  }
  
  // If no match found, return the database position or 'G' as fallback
  return 'G';
}

export function getPositionDisplayName(position: string): string {
  const positionMap: { [key: string]: string } = {
    'PG': 'Point Guard',
    'SG': 'Shooting Guard', 
    'SF': 'Small Forward',
    'PF': 'Power Forward',
    'C': 'Center',
    'G': 'Guard',
    'F': 'Forward',
    'PG/SG': 'Guard',
    'SG/SF': 'Wing',
    'SF/PF': 'Forward',
    'PF/C': 'Big Man',
    'F/C': 'Big Man'
  };
  
  return positionMap[position] || position;
}