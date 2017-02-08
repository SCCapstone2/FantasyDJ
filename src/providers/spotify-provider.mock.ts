import {
  SpotifyImage,
  SpotifyUser,
  SpotifySimplifiedArtist,
  SpotifyArtist,
  SpotifySimplifiedAlbum,
  SpotifyAlbum,
  SpotifySimplifiedTrack,
  SpotifyTrack,
  SpotifySearchResult,
  SpotifySearchType,
  SpotifyPagingObject} from '../models/spotify-models';

export class SpotifyProviderMock {

  loadCurrentUser(): Promise<SpotifyUser> {
    return Promise.resolve(<SpotifyUser>{
      href: '',
      id: '0123456789',
      name: 'Spotify User 1',
      uri: '',
      images: <Array<SpotifyImage>>[],
      display_name: 'Spotify User 1 Display Name',
      email: 'a@b.cd'
    });
  }

  loadArtist(artistId: string): Promise<SpotifyArtist> {
    return Promise.resolve(<SpotifyArtist>{
      href: '',
      id: '',
      name: 'Spotify Artist 1',
      uri: '',
      images: <Array<SpotifyImage>>[],
    });
  }

  private static SIMPLIFIED_ARTIST_1: SpotifySimplifiedArtist =
    <SpotifySimplifiedArtist>{
      href: '',
      id: '',
      name: 'Spotify Artist 1',
      uri: ''
    };

  private static TRACKS: SpotifyPagingObject<SpotifySimplifiedTrack> =
    <SpotifyPagingObject<SpotifySimplifiedTrack>>{
      href: '',
      items: <Array<SpotifySimplifiedTrack>>[
        <SpotifySimplifiedTrack>{
          href: '',
          id: '',
          name: 'Spotify Artist 1',
          uri: '',
          artists: [SpotifyProviderMock.SIMPLIFIED_ARTIST_1]
        }
      ]
    };

  loadAlbum(albumId: string): Promise<SpotifyAlbum> {
    return Promise.resolve(<SpotifyAlbum>{
      href: '',
      id: '',
      name: 'Spotify Album 1',
      uri: '',
      images: <Array<SpotifyImage>>[],
      artists: [SpotifyProviderMock.SIMPLIFIED_ARTIST_1],
      tracks: SpotifyProviderMock.TRACKS
    });
  }

  loadTrack(trackId: string): Promise<SpotifyTrack> {
    return Promise.resolve(<SpotifyTrack>{
      href: '',
      id: '',
      name: 'Spotify Artist 1',
      uri: '',
      artists: [SpotifyProviderMock.SIMPLIFIED_ARTIST_1],
      album: <SpotifySimplifiedAlbum> {
        href: '',
        id: '',
        name: 'Spotify Album 1',
        uri: '',
        images: <Array<SpotifyImage>>[],
        artists: [SpotifyProviderMock.SIMPLIFIED_ARTIST_1]
      }
    });
  }

  search(query: string,
         types?: SpotifySearchType[],
         limit?: number,
         offset?: number): Promise<SpotifySearchResult> {
    return Promise.resolve(<SpotifySearchResult>{
      tracks: SpotifyProviderMock.TRACKS
    });
  }

};