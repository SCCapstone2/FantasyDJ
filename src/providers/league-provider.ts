import { Injectable } from '@angular/core';
import { AngularFireDatabase,
         FirebaseListObservable,
         FirebaseObjectObservable} from 'angularfire2';

import { Observable } from 'rxjs/Observable';

import { SongData } from './song-provider';
import { League} from '../models/fantasydj-models';

@Injectable()
export class LeagueData {

  private fbLeagues: FirebaseListObservable<any[]>;

  constructor(private db: AngularFireDatabase,
              private songData: SongData) {
    this.fbLeagues = this.db.list('/Leagues');
  }

  loadLeague(leagueId: string): Promise<League> {
    return new Promise<League>((resolve, reject) => {
      this.db.object('/Leagues/' + leagueId)
        .map(this.mapFBLeague)
        .subscribe(league => {
          if (! league) {
            reject('league does not exist');
          }
          resolve(league);
        });
    });
  }


  loadLeagues(userId: string): Observable<League[]> {
    return this.db.list(this.fbUserLeaguesUrl(userId))
      .map(items => {
        let leagues: League[] = [];
        for (let item of items) {
          this.loadLeague(item.$key)
            .then(league => leagues.push(league))
            .catch(error => {
              console.log(error);
            });
        }
        return leagues;
      });
  }

  createLeague(name: string,
               creatorId: string,
               opponentId: string): Promise<League> {
    return new Promise<League>((resolve, reject) => {
      let usersRef = {};
      usersRef[creatorId] = true;
      usersRef[opponentId] = false;
      // usersRef["members"] = [creatorId];

      let leagueId: string = this.fbLeagues.push({
        name: name,
        creator: creatorId,
        users: usersRef
      }).key;

      if (leagueId) {
        console.log(leagueId);
        this.loadLeague(leagueId).then(league => {
            this.db.object(this.fbUserLeaguesUrl(creatorId, leagueId))
              .set(true)
              .then(_ => {
                this.db.object(this.fbUserLeaguesUrl(opponentId, leagueId))
                  .set(false)
                  .then(_ => resolve(league))
                  .catch(error => reject(error));
              })
              .catch(error => reject(error));
          }).catch(error => reject(error));
      }
      else {
        reject('no leagueId generated');
      }
    });
  }

  private fbUserLeaguesUrl(userId: string, leagueId?: string): string {
    let url = '/UserProfiles/' + userId + '/leagues';
    if (leagueId) {
      url += '/' + leagueId;
    }
    return url;
  }

  private dbObj(...pathElems: string[]): FirebaseObjectObservable<any> {
    return this.db.object('/' + pathElems.join('/'));
  }

  private mapFBLeague(fbleague): League {
    console.log('start mapFBLeague');
    if ('$value' in fbleague && ! fbleague.$value) {
      console.log(fbleague, 'returning null');
      return null;
    }

    let league = <League>{
      id: fbleague.$key,
      name: fbleague.name,
      users: [],
      draftDate: fbleague.draftDate,
      endTime: fbleague.endTime,
      winner: fbleague.winner || null
    };
    for (var key in fbleague.users) {
      league.users.push(key);
    }

    return league;
  }

  addSong(userId: string,
          leagueId: string,
          spotifyTrackId: string,
          songName: string,
          songArtist: string): Promise<League> {
    return new Promise<League>((resolve, reject) => {
      this.songData.createSong(spotifyTrackId, songName, songArtist)
        .then(song => {
          this.loadLeague(leagueId).then(league => {
            if (!song.id) {
              reject('song was returned but is undefined');
            }
            else {
              this.dbObj('Leagues', leagueId, 'users', userId, song.id)
                .set(true)
                .then(_ => {
                  this.dbObj('Songs', song.id, 'leagues', leagueId)
                    .set(true)
                    .then(_ => resolve(league))
                    .catch(err => reject(err));
                })
                .catch(err => reject(err));
            }
          });
        });
    });
  }


  deleteLeague(leagueId: string): Promise<boolean> {
    return new Promise<boolean>((resolve, reject) => {
      console.log('removing league ' + leagueId);
      this.loadLeague(leagueId).then(league => {
        for (let userId of league.users) {
          this.db.object('/Leagues/' + leagueId + '/users/' + userId)
            .forEach(userRef => {
              console.log(userRef);
              for (let songId in userRef) {
                if (! songId.startsWith('$')) {
                  console.log('songId: ' + songId);
                  this.db.object('/Songs/' + songId + '/leagues/' + leagueId)
                    .remove()
                    .then(() => {
                      console.log('league '
                                  + leagueId
                                  + ' removed from song '
                                  + songId);
                    })
                    .catch(err => {
                      console.log('error removing league '
                                  + leagueId
                                  + ' from song '
                                  + songId);
                    });
                }
              }
            });

          this.db.object('/UserProfiles/' + userId + '/leagues/' + leagueId)
            .remove()
            .then(() => {
              console.log('league '
                          + leagueId
                          + ' removed from user '
                          + userId);
            })
            .catch(err => {
              console.log('error removing league '
                          + leagueId
                          + ' from user '
                          + userId);
            });
        }
      }).then(() => {
        this.db.object('/Leagues/' + leagueId)
          .remove()
          .then(() => resolve(true))
          .catch(err => reject(err));
      }).catch(err => reject(err));
    });
  }

getOpponentId(userId: string, leagueId: string): string {
  let opponent_id: string = null;
  this.db.list('/Leagues/'+leagueId+'/users/').forEach(user=>{
      if (user.length > 0){
        for(var i = 0; i < user.length; i++)
          if (user[i].$key != userId){
            opponent_id = user[i].$key;
      } }  
    });
  return opponent_id;
} 

getCreatorId(leagueId: string): string {
  let creator_id: string = null;
  this.db.object('/Leagues/' + leagueId + '/creator', 
    {preserveSnapshot: true}).subscribe(snapshot => {
      creator_id = snapshot.val();
    });
    return creator_id;
}

songAlreadyInLeague(songId: string, leagueId: string, 
                  userId: string, opponent_id: string): boolean{
  if(!songId) return false;
  console.log('query: ' + '/Leagues/'+leagueId+'/users/'+opponent_id+'/'+songId);
  let test = this.db.object('/Songs/' + songId + '/leagues/' + leagueId);
  console.log('songAlreadyInLeague: ' + test);
  if(test){
    return true;
  }
  else return false;
  
  
}
}
