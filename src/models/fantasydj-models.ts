export interface User {
  id?: string,
  email?: string,
  leagues?: any[],
  dateCreated: Date
};

export interface League {
  id: string,
  name: string,
  creator: string,
  users: any[],
  draftDate: Date,
  endTime: Date,
  winner: string
};

export interface Song {
  id: string,
	artist: string,
	name: string,
	spotifyId: string,
	leagues: any[],
  artwork?: string,
  preview: string
};

export interface Score {
  key: string,
  scores: any[],
  total: number
};
