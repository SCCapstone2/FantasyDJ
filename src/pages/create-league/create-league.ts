import { Component } from '@angular/core';
import { NavController, NavParams  } from 'ionic-angular';
import { OAuthService } from '../../providers/oauth-service';

import { User} from '../../models/fantasydj-models';
import { LeagueData } from '../../providers/league-provider';
import { UserData } from '../../providers/user-provider';
import {Validators, FormBuilder } from '@angular/forms';


/*
 Generated class for the CreateLeague page.

 See http://ionicframework.com/docs/v2/components/#navigation for more info on
 Ionic pages and navigation.
 */
@Component({
  selector: 'page-create-league',
  templateUrl: 'create-league.html'
})
export class CreateLeaguePage {
  currentUser: User = null;

  name: string;
  opponent: string;
  leagueForm: any;

  constructor(public navCtrl: NavController,
              public navParams: NavParams,
              private authService: OAuthService,
              private userData: UserData,
              private leagueData: LeagueData,
              private formBuilder: FormBuilder) {
    this.leagueForm = this.formBuilder.group({
      name: ['', Validators.compose([Validators.pattern('[a-zA-Z ]*'), Validators.required])],
      opponent: ['', Validators.required],
    });
    if (this.authService.token) {
      this.userData.loadCurrentUser().then(user => {
        this.currentUser = user;
      }).catch(error => console.log(error));
    }
  }

  ionViewDidLoad() {
    console.log('Hello CreateLeague Page');
  }

  createLeague(){
    this.leagueData.createLeague(
      this.leagueForm.name,
      this.currentUser.id,
      this.leagueForm.opponent
    ).then(league => {
      console.log('created league: ' + league.name);
      this.navCtrl.pop();
    }).catch(err => {
      console.log(err, 'error creating new league');
    });
  }
}
