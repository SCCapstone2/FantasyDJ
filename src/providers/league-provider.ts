/**
 * Provider for leagues
 */
import { Injectable } from '@angular/core';
import { AngularFireDatabase,
  FirebaseListObservable,
  FirebaseObjectObservable} from 'angularfire2';

import { Observable } from 'rxjs/Observable';

import { IonicCloud } from './ionic-cloud-provider';
import { SongData } from './song-provider';
import { UserData } from './user-provider';
import { League, User, Song } from '../models/fantasydj-models';
import { SpotifyTrack } from '../models/spotify-models';

import 'rxjs/add/operator/take';

@Injectable()
export class LeagueData {

  private fbLeagues: FirebaseListObservable<any[]>;

  constructor(private db: AngularFireDatabase,
              private songData: SongData,
              private userData: UserData,
              private ionicCloud: IonicCloud) {
    this.fbLeagues = this.db.list('/Leagues');
  }

  /**
   * load a league given its key, map the untyped json object
   * from firebase to a league object, and return
   */
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

  /**
   * load all of the leagues that a user is a member of,
   * each league is mapped to a league object,
   * and an observable array of league objects is returned
   */
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

  /**
   * load all the leagues that a user is a member of that
   * are currently ongoing
   */
  loadCurrentLeagues(userId: string): Observable<League[]> {
    return this.db.list(this.fbUserLeaguesUrl(userId))
      .map(items => {
        let leagues: League[] = [];
        for (let item of items) {
          this.loadLeague(item.$key)
            .then(league => {
              if(league.winner == null){
              leagues.push(league);}
            })
            .catch(error => {
              console.log(error);
            });
        }
        return leagues;
      });
  }

  /**
   * load all the leagues that a user is a member of that
   * have ended
   */
  loadPastLeagues(userId: string): Observable<League[]> {
    return this.db.list(this.fbUserLeaguesUrl(userId))
      .map(items => {
        let leagues: League[] = [];
        for (let item of items) {
          this.loadLeague(item.$key)
            .then(league => {
              if(league.winner){
              leagues.push(league);}
            })
            .catch(error => {
              console.log(error);
            });
        }
        return leagues;
      });
  }

  /**
   * create a new league from the name and and two players
   */
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
                .then(_ => {
                  this.ionicCloud.sendPush(
                    opponentId,
                    creatorId +
                    ' has invited you to league ' +
                    league.name
                  )
                    .then(_ => resolve(league))
                    .catch(err => reject(err));
                })
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

  /**
   * Convenience method to build path for either a user's leagues or
   * a specific league within firebase
   */
  private fbUserLeaguesUrl(userId: string, leagueId?: string): string {
    let url = '/UserProfiles/' + userId + '/leagues';
    if (leagueId) {
      url += '/' + leagueId;
    }
    return url;
  }

  /**
   * Convenience method to get a reference to a firebase object
   * by concatenating path elements
   */
  private dbObj(...pathElems: string[]): FirebaseObjectObservable<any> {
    return this.db.object('/' + pathElems.join('/'));
  }

  /**
   * create a league object from a untyped json object from firebase
   */
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
      startTime: fbleague.startTime,
      endTime: fbleague.endTime,
      winner: fbleague.winner || null
    };
    for (var key in fbleague.users) {
      league.users.push(key);
    }

    return league;
  }

  /**
   * test whether a song has already been chosen in a league
   */
  private leagueHasSong(leagueId: string, songId:string): Promise<boolean> {
    return new Promise<boolean>((resolve, reject) => {
      this.dbObj('Songs', songId, 'leagues', leagueId)
        .take(1)
        .subscribe(snapshot => {
          if (snapshot.$value == true) {
            resolve(true);
          }
          else {
            resolve(false);
          }
        });
    });
  }

  /**
   * test if a league has 6 songs already chosen
   */
  private leagueIsFull(leagueId: string): Promise<boolean> {
    return new Promise<boolean>((resolve, reject) => {
      let size: number = 0;

      this.dbObj('Leagues', leagueId, 'users')
        .take(1)
        .forEach(usersRef => {
          for (let userId in usersRef) {
            if (! userId.startsWith('$')) {
              for (let songId in usersRef[userId]) {
                size++;
              }
            }
          }
        })
        .then(() => {
          resolve(size >= 6);
        })
        .catch(error => reject(error));
    });
  }

  /**
   * called when a user chooses a new song for their playlist,
   * calls createSong, checks if song is already in the league,
   * and add it to league if not. Also checks if league is full,
   * and sends appropriate message to other player.
   */
  public updatePlaylist(userId: string,
                        leagueId: string,
                        spotifyTrack: SpotifyTrack): Promise<Song> {
    return new Promise<Song>((resolve, reject) => {
      let song: Song = null;
      let league: League = null;
      let message: string = null;
      let recipients: Array<string> = [];

      this.songData.createSong(spotifyTrack)
        .then(songResult => {
          song = songResult;
          return this.leagueHasSong(leagueId, songResult.id);
        })
        .then(leagueHasSong => {
          if (leagueHasSong) {
            throw new Error('song already in league');
          }
          return this.loadLeague(leagueId);
        })
        .then(leagueResult => {
          league = leagueResult;
        })
        .then(() => {
          return this.dbObj(
            'Leagues', leagueId, 'users', userId, song.id
          ).set(true);
        })
        .then(() => {
          return this.dbObj(
            'Songs', song.id, 'leagues', leagueId
          ).set(true);
        })
        .then(() => {
          return this.getOpponent(userId, leagueId);
        })
        .then(opponent => {
          recipients.push(opponent.id);
          return this.leagueIsFull(leagueId);
        })
        .then(full => {
          if (! full) {
            message = `It is your turn to choose a song for league ${league.name}`;
          }
          else {
            recipients.push(userId);
            message = `All songs in league ${league.name} have been chosen.`;
          }
          return this.setLeagueDatesIfFull(leagueId, full);
        })
        .then(_ => {
          for (let recipient of recipients) {
            console.log(`sending message to ${recipient}: ${message}`);
            this.ionicCloud.sendPush(recipient, message)
              .then(res => {
                console.log('sendPush for league turn success');
              })
              .catch(err => {
                console.log('sendPush for league turn failure', err);
              });
          }
        })
        .then(() => resolve(song))
        .catch(error => reject(error));
    });
  }

  /**
   * if the league is full, set the start and end times for the league
   */
  private setLeagueDatesIfFull(leagueId: string, full: boolean): Promise<League> {
    if (full) {
      return new Promise<League>((resolve, reject) => {
        let startTime: Date = new Date();
        let endTime: Date = new Date(
          startTime.getTime() + (7 * 24 * 60 * 60 * 1000)
        );
        let dates = {
          startTime: startTime,
          endTime: endTime
        };

        this.dbObj('Leagues', leagueId).update(dates)
          .then(() => {
            return this.loadLeague(leagueId);
          })
          .then(league => {
            resolve(league);
          })
          .catch(error => reject(error));
      });
    }
    else {
      return this.loadLeague(leagueId);
    }
  }

  /**
   * delete a league by removing the league from the db,
   * and removing it from songs' leagues lists and users'
   * leagues lists
   */
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

  /**
   * given a user and a league, return the opponent
   */
  getOpponent(userId: string, leagueId: string): Promise<User> {
    return new Promise<User>((resolve, reject) => {
      this.db.list('/Leagues/'+leagueId+'/users/').subscribe(user=>{
        if (user.length > 0){
          for(var i = 0; i < user.length; i++){
            if (user[i].$key != userId){
              console.log('user[i].$key: ' + user[i].$key);
              this.userData.loadUser(user[i].$key).then(user =>
                resolve(user))
                .catch(err => reject(err));
            }
          }
        }
      });
    });
  }

  /**
   * return the creator of the league
   */
  getCreator(leagueId: string): Promise<User> {
    return new Promise<User>((resolve, reject) => {
      this.db.object('/Leagues/' + leagueId + '/creator',
        {preserveSnapshot: true}).subscribe(snapshot => {
        this.userData.loadUser(snapshot.val()).then(user =>
          resolve(user))
          .catch(err => reject(err));
      });
    });
  }

  /**
   * return the winner of a league, if league isn't over returns null
   */
  getWinner(leagueId: string): Promise<User> {
    return new Promise<User>((resolve, reject) => {
      this.db.object('/Leagues/' + leagueId + '/winner',
        {preserveSnapshot: true}).subscribe(snapshot => {
        this.userData.loadUser(snapshot.val()).then(user =>
          resolve(user))
          .catch(err => resolve(null));
      });
    });
  }

  /**
   * get the time the league started
   */
  getStartDate(leagueId: string): Promise<string>{
    return new Promise<string>((resolve, reject) => {
      this.db.object('/Leagues/' + leagueId + '/startTime').take(1).subscribe(
        snapshot => {
          resolve(snapshot.$value);
        });
    });
  }

  /**
   * get the time the league will end
   */
  getEndDate(leagueId: string): Promise<string>{
    return new Promise<string>((resolve, reject) => {
      this.db.object('/Leagues/' + leagueId + '/endTime').take(1).subscribe(
        snapshot => {
          resolve(snapshot.$value);
        });
     });
  }

/**
 * test whether a user is the creator of a league
 */
public isCreator(leagueId: string, userId: string): Observable<boolean>{
  return this.dbObj('Leagues', leagueId, 'creator')
          .take(1)
          .map(ref => {
            if (ref.$value == userId) {
                return true;
            }
            else return false
          });
}

/**
 * test whether a user is the winner of a league
 */
isWinner(leagueId: string, userId: string): Observable<boolean>{
  return this.dbObj('Leagues', leagueId, 'winner')
          .take(1)
          .map(ref => {
            if(ref.$value == null) return null;
            else if (ref.$value == userId) {
                return true;
            }
            else return false
          });
}

  /**
   * returns the array of dates during which the league is ongoing
   */
  getDates(leagueId: string): Promise<Date[]> {
    return new Promise<Date[]>((resolve, reject) => {
      this.getStartDate(leagueId).then(date => {
        console.log(date);
        let start_date = new Date(date);
        start_date.setDate(start_date.getDate() + 1);
        this.getEndDate(leagueId).then(endDate => {
          let end_date = new Date(endDate);
          this.getDatesInner(start_date, end_date).then(dates => resolve(dates));
        });
      });
    });
  }

  /**
   * iterate through start and stop dates
   */
  getDatesInner(startDate: Date, stopDate:Date): Promise<Date[]> {
    return new Promise<Date[]>((resolve, reject) => {
      let dateArray: Date[] = [];
      let currentDate = startDate;
      while (currentDate <= stopDate) {
        dateArray.push( new Date(currentDate))
        currentDate.setDate(currentDate.getDate() + 1);
      }
      resolve(dateArray);
    });
  }

  /**
   * return the cummulative score for all of a user's songs in a league
   */
  public getPlaylistScore(leagueId: string, userId: string): Observable<number> {
    return this.dbObj('Leagues', leagueId, 'users', userId)
      .take(1)
      .map(userRef => {
        let total = 0;
        for (var songId in userRef) {
          if (! songId.startsWith('$')) {
            for (var date in userRef[songId]) {
              total += userRef[songId][date];
            }
          }
        }
        return total;
      });
  }

  /**
   * return the score for a single song in a league
   */
  public getSongScore(leagueId: string, userId: string, songId: string): Observable<number> {
    return this.dbObj('Leagues', leagueId, 'users', userId, songId)
      .take(1)
      .map(songRef => {
        let total = 0;
        for(var date in songRef){
          if (! date.startsWith('$')) {
            total += songRef[date];
          }
        }
        return total;
      });
  }

  /**
   * get all the scores of each song in a user's playlist in a league
   */
  getLeagueData(leagueId: string, userId: string): Promise<any[]> {
    return new Promise<any[]>((resolve, reject) => {
      let songArray: any[] = [];
      this.dbObj('Leagues', leagueId, 'users', userId)
        .take(1)
        .forEach(songsRef => {
          let counter: number = 0;
          for (let songId in songsRef) {
            let scores: number[] =[];
            if(! songId.startsWith('$')){
              for (let date in songsRef[songId]){
                if(! date.startsWith('$')){
                  scores.push(songsRef[songId][date])
                }
              }
            }
            if(scores.length > 0){
              songArray[counter] = scores;
              counter = counter +1;
            }
          }
          console.log(songArray);
        })
        .then(() => {
          resolve(songArray);
        })
        .catch(error => reject(error));
    });
  }

  /**
   * return an array of the names of songs in a user's playlist
   */
  getSongNames(leagueId: string, userId: string): Promise<any[]>{
    return new Promise<any[]>((resolve, reject) => {
      let nameArray: any[] = [];
      this.dbObj('Leagues', leagueId, 'users', userId)
        .take(1)
        .forEach(songsRef => {
          for(let songId in songsRef){
            console.log(songId);
            if(! songId.startsWith('$')){
              this.songData.getSongName(songId).then(name => {
                nameArray.push(name);
              });
            }
          }
        })
        .then(() => {
          resolve(nameArray);
        })
        .catch(error => reject(error));
    });
  }

}
