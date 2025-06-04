// NBA team colors mapping
export const NBA_TEAM_COLORS: Record<string, { primary: string; secondary: string; name: string }> = {
  // Atlantic Division
  'BOS': { primary: '#007A33', secondary: '#BA9653', name: 'Boston Celtics' },
  'BKN': { primary: '#000000', secondary: '#FFFFFF', name: 'Brooklyn Nets' },
  'NYK': { primary: '#006BB6', secondary: '#F58426', name: 'New York Knicks' },
  'PHI': { primary: '#006BB6', secondary: '#ED174C', name: 'Philadelphia 76ers' },
  'TOR': { primary: '#CE1141', secondary: '#000000', name: 'Toronto Raptors' },

  // Central Division
  'CHI': { primary: '#CE1141', secondary: '#000000', name: 'Chicago Bulls' },
  'CLE': { primary: '#860038', secondary: '#FDBB30', name: 'Cleveland Cavaliers' },
  'DET': { primary: '#C8102E', secondary: '#1D42BA', name: 'Detroit Pistons' },
  'IND': { primary: '#002D62', secondary: '#FDBB30', name: 'Indiana Pacers' },
  'MIL': { primary: '#00471B', secondary: '#EEE1C6', name: 'Milwaukee Bucks' },

  // Southeast Division
  'ATL': { primary: '#E03A3E', secondary: '#C1D32F', name: 'Atlanta Hawks' },
  'CHA': { primary: '#1D1160', secondary: '#00788C', name: 'Charlotte Hornets' },
  'MIA': { primary: '#98002E', secondary: '#F9A01B', name: 'Miami Heat' },
  'ORL': { primary: '#0077C0', secondary: '#C4CED4', name: 'Orlando Magic' },
  'WAS': { primary: '#002B5C', secondary: '#E31837', name: 'Washington Wizards' },

  // Northwest Division
  'DEN': { primary: '#0E2240', secondary: '#FEC524', name: 'Denver Nuggets' },
  'MIN': { primary: '#0C2340', secondary: '#236192', name: 'Minnesota Timberwolves' },
  'OKC': { primary: '#007AC1', secondary: '#EF3B24', name: 'Oklahoma City Thunder' },
  'POR': { primary: '#E03A3E', secondary: '#000000', name: 'Portland Trail Blazers' },
  'UTA': { primary: '#002B5C', secondary: '#00471B', name: 'Utah Jazz' },

  // Pacific Division
  'GSW': { primary: '#1D428A', secondary: '#FFC72C', name: 'Golden State Warriors' },
  'LAC': { primary: '#C8102E', secondary: '#1D428A', name: 'LA Clippers' },
  'LAL': { primary: '#552583', secondary: '#FDB927', name: 'Los Angeles Lakers' },
  'PHX': { primary: '#1D1160', secondary: '#E56020', name: 'Phoenix Suns' },
  'SAC': { primary: '#5A2D81', secondary: '#63727A', name: 'Sacramento Kings' },

  // Southwest Division
  'DAL': { primary: '#00538C', secondary: '#002F5F', name: 'Dallas Mavericks' },
  'HOU': { primary: '#CE1141', secondary: '#000000', name: 'Houston Rockets' },
  'MEM': { primary: '#5D76A9', secondary: '#12173F', name: 'Memphis Grizzlies' },
  'NOP': { primary: '#0C2340', secondary: '#C8102E', name: 'New Orleans Pelicans' },
  'SAS': { primary: '#C4CED4', secondary: '#000000', name: 'San Antonio Spurs' },

  // Historical teams
  'SEA': { primary: '#006B3C', secondary: '#FFC200', name: 'Seattle SuperSonics' },
  'VAN': { primary: '#001489', secondary: '#D4AF37', name: 'Vancouver Grizzlies' },
  'NOH': { primary: '#0C2340', secondary: '#C8102E', name: 'New Orleans Hornets' },
  'NOK': { primary: '#0C2340', secondary: '#C8102E', name: 'New Orleans/Oklahoma City Hornets' },
  'CHA_OLD': { primary: '#1D1160', secondary: '#00788C', name: 'Charlotte Hornets (Original)' },
  'NJN': { primary: '#000000', secondary: '#FFFFFF', name: 'New Jersey Nets' },
  'WSB': { primary: '#002B5C', secondary: '#E31837', name: 'Washington Bullets' },

  // Default fallback
  'DEFAULT': { primary: '#1F2937', secondary: '#6B7280', name: 'Unknown Team' }
};

export const getTeamColors = (teamAbbr: string) => {
  return NBA_TEAM_COLORS[teamAbbr] || NBA_TEAM_COLORS.DEFAULT;
};

export const getTeamGradient = (teamAbbr: string) => {
  const colors = getTeamColors(teamAbbr);
  return `linear-gradient(135deg, ${colors.primary} 0%, ${colors.secondary} 100%)`;
};

export const getTeamTextColor = (teamAbbr: string) => {
  const colors = getTeamColors(teamAbbr);
  // Determine if we need light or dark text based on background
  const primaryColor = colors.primary;
  const isLight = primaryColor === '#FFFFFF' || primaryColor === '#FFC72C' || primaryColor === '#FDBB30' || primaryColor === '#C4CED4';
  return isLight ? '#000000' : '#FFFFFF';
};