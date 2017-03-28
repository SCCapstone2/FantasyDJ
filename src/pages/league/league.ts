import { Component } from '@angular/core';
import { NavController, NavParams, AlertController } from 'ionic-angular';
import { Observable } from 'rxjs/Observable';
import { PlayerDetailsPage } from '../player-details/player-details';
//import 'rxjs/add/Observable/zipArray';
import { League, User, Score, Song } from '../../models/fantasydj-models';
import { LeagueData } from '../../providers/league-provider';
import { UserData } from '../../providers/user-provider';
import { SongData } from '../../providers/song-provider';
import {OpponentDetailsPage} from "../opponent-details/opponent-details";
import { AnalyticsPage } from '../analytics/analytics';

/*
 Generated class for the League page.
 See http://ionicframework.com/docs/v2/components/#navigation for more info on
 Ionic pages and navigation.
 */
@Component({
  selector: 'page-league',
  templateUrl: 'league.html'
})
export class LeaguePage {

  league: League;
  playerDetailsPage = PlayerDetailsPage;
  users: Observable<User[]>;
  current: User = null;
  opponent: User;
  winner_flag = null;
  songs: Observable<Song[]>;
  opp_songs: Observable<Song[]>;

  constructor(public navCtrl: NavController,
              public navParams: NavParams,
              private leagueData: LeagueData,
              public alertCtrl: AlertController,
              private userData: UserData,
              private songData: SongData) {
    this.league = this.navParams.get('league');
    this.current = this.navParams.get('currentUser');
    this.users = this.userData.loadUsers(this.league.id);
    this.userData.loadCurrentUser().then(user => {
      this.current = user;
      this.songs = this.songData.loadSongs(this.league.id, this.current.id);
      this.leagueData.getWinner(this.league.id).then(winner => {
      if(winner != null){
        console.log('winner: ' + winner.id);
        if(winner.id == this.current.id){
          this.winner_flag = true;
        }
        else this.winner_flag = false;
      }
    });
      this.leagueData.getOpponent(user.id, this.league.id).then(opp =>{
        this.opponent = opp;
        this.opp_songs = this.songData.loadSongs(this.league.id, this.opponent.id);
      }).catch(error => console.log(error));
    }).catch(error => console.log(error));

    
  }

  ionViewDidLoad() {
    console.log('Hello League page');

  }

  goToPlayer(user, league) {
    console.log("user: " + user.id);
    if(this.current.id == user.id){
      this.navCtrl.push(PlayerDetailsPage, {
        user: user,
        league: league
      });
    }
    else {
      this.navCtrl.push(OpponentDetailsPage, {
        user: user,
        league: league
      });
    }
  }

  deleteThisLeague() {
    let confirm = this.alertCtrl.create({
      title: 'Delete League',
      message: 'Do you really want to delete this league?',
      buttons: [
        {
          text: 'No',
          handler: () => {
            console.log('No clicked');
          }
        },
        {
          text: 'Yes',
          handler: () => {
            this.leagueData.deleteLeague(this.league.id)
              .then(() => this.navCtrl.pop())
              .catch(err => console.log(err));
            console.log('Yes clicked');
          }
        }
      ]
    });
    confirm.present();
  }

  getScore(leagueId, userId){
    return this.leagueData.getPlaylistScore(leagueId, userId);
  }

  getSongScore(leagueId, userId, songId) {
    return this.leagueData.getSongScore(leagueId, userId, songId);
  }

  goToAnalytics(user, league, opponent) {
    this.navCtrl.push(AnalyticsPage, {
      league: league,
      user : user
    });
  }

}
