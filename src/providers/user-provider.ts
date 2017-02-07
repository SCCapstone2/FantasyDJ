import { Injectable } from '@angular/core';
import { AngularFireDatabase } from 'angularfire2';
import { Observable } from 'rxjs/Observable';

import { SpotifyProvider } from './spotify-provider';

import { SpotifyUser } from '../models/spotify-models';
import { User } from '../models/fantasydj-models';

@Injectable()
export class UserData {

  constructor(private db: AngularFireDatabase, private spotify: SpotifyProvider) {}

  loadCurrentUser(): Promise<User> {
    return new Promise<User>((resolve, reject) => {
      this.spotify.loadCurrentUser().then(spotifyUser => {
        // since we have a spotify user, try to load
        // fantasy-dj user
        this.loadUser(spotifyUser.id)
          .then(user => resolve(user))
          .catch(error => {
            // no fantasy-dj user, so let's create one
            this.createUser(spotifyUser)
              .then(user => resolve(user))
              .catch(error => reject(error));
          });
      }).catch(error => {
        reject(error);
      });
    });
  }

  createUser(spotifyUser: SpotifyUser): Promise<User> {
    return new Promise<User>((resolve, reject) => {

      if (!spotifyUser || spotifyUser.id === undefined) {
        reject('no spotify user. unable to create user.');
        return;
      }

      this.db.object('/UserProfiles/' + spotifyUser.id).update({
        dateCreated: new Date(),
        userEmail: spotifyUser.email
      }).then(_ => {
        this.loadUser(spotifyUser.id).then(user => resolve(user));
      }).catch(err => reject(err));
    });
  }

  loadUser(userId: string): Promise<User> {
    return new Promise<User>((resolve, reject) => {
      this.db.object('/UserProfiles/' + userId).map(fbuser => {

        if ('$value' in fbuser && ! fbuser.$value) {
          reject('user ' + userId + ' does not exist');
          return;
        }

        let user = <User>{
          id: fbuser.$key,
          email: fbuser.userEmail,
          leagues: [],
          dateCreated: fbuser.dateCreated
        };
        for (var key in fbuser.leagues) {
          user.leagues.push(key);
        }

        return user;
      }).subscribe(usr => resolve(usr));
    });
  }

  loadUsers(leagueId: string): Observable<User[]> {
    return this.db.list('/Leagues/' + leagueId + '/users')
      .map(items => {
        let users: User[] = [];
        for (let item of items) {
          this.loadUser(item.$key)
            .then(user => users.push(user))
            .catch(error => console.log(error));
        }
        return users;
      });
  }

};
