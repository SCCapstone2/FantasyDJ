import { Component, ViewChild } from '@angular/core';
import { NavController, NavParams } from 'ionic-angular';
import { BaseChartDirective } from 'ng2-charts/ng2-charts'
import { LeagueData } from '../../providers/league-provider';
import { UserData } from '../../providers/user-provider';
import { User, League} from '../../models/fantasydj-models';
import { Observable } from 'rxjs/Observable';


/*
  Generated class for the Analytics page.

  See http://ionicframework.com/docs/v2/components/#navigation for more info on
  Ionic pages and navigation.
*/

@Component({
  selector: 'page-analytics',
  templateUrl: 'analytics.html'
})
export class AnalyticsPage {

  @ViewChild(BaseChartDirective)
  public chart: BaseChartDirective;

  user: User;
  league: League;
  opponent: User;
  users: Observable<User[]>;
  song1: number[];
  song2: number[];
  song3: number[];
  data_flag: string;

  // it is neccessary to initialize all data for the chart
  lineChartData: Array<any> = [
            {data: [], label: 'Song A'},
            {data: [], label: 'Song B'},
            {data: [], label: 'Song C'}
          ];

  tableData: Array<any> = [
            {data: [], label: 'Song A'},
            {data: [], label: 'Song B'},
            {data: [], label: 'Song C'}
  ];

  public lineChartLabels:Array<any> = ["Day 1", "Day 2", "Day 3", "Day 4", "Day 5", "Day 6", "Day 7"];

  public lineChartOptions:any = {
    legend: {labels:{fontColor:"white", fontSize: 15}},
    scales: {
          xAxes: [{
            ticks: {
              fontColor: "white",
              fontSize: 12,
            },
            gridLines: {
              color: 'rgba(255,255,255,1)',
              lineWidth: 1
            }
          }],
          yAxes: [{
            ticks: {
              fontColor: "white",
              fontSize: 12,
            },
            gridLines: {
              color: 'rgba(255,255,255,1)',
              lineWidth: 1
            }
          }]
        },
    responsive: true
  };

  // initialize the colors for the chart
  public lineChartColors:Array<any> = [
    {
      // light green
      backgroundColor: 'rgba(153, 230, 172, 0.2)',
      borderColor: 'rgba(153, 230, 172, 1)',
      pointBackgroundColor: 'rgba(153, 230, 172, 0.2)',
      pointBorderColor: '#fff',
      pointHoverBackgroundColor: '#fff',
      pointHoverBorderColor: 'rgba(153, 230, 172, 1)'
    },
    {
      // green
      backgroundColor: 'rgba(49, 195, 86, 0.2)',
      borderColor: 'rgba(49, 195, 86, 1)',
      pointBackgroundColor: 'rgba(49, 195, 86, 0.2)',
      pointBorderColor: '#fff',
      pointHoverBackgroundColor: '#fff',
      pointHoverBorderColor: 'rgba(49, 195, 86, 1)'
    },
    { // darkest green
      backgroundColor: 'rgba(214, 245, 222, 0.2)',
      borderColor: 'rgba(214, 245, 222, 1)',
      pointBackgroundColor: 'rgba(214, 245, 222, 0.2)',
      pointBorderColor: '#fff',
      pointHoverBackgroundColor: '#fff',
      pointHoverBorderColor: 'rgba(214, 245, 222, 1)'
    }
  ];

  public lineChartLegend:boolean = true;
  public lineChartType:string = 'line';


  constructor(public navCtrl: NavController,
  			  public navParams: NavParams,
  			  private leagueData: LeagueData,
          private userData: UserData) {

  	this.user = this.navParams.get('user');
    this.league = this.navParams.get('league');
    this.opponent = this.navParams.get('opponent');
    this.users = this.userData.loadUsers(this.league.id);
    this.data_flag = 'user';

    // get the days that the league ran during
    this.leagueData.getDates(this.league.id).then(dates => {
      this.lineChartLabels = dates.map(this.dateToDay);
      this.chart.chart.update();
    }).catch(error => console.log(error));

    // get song scores, reduce them, and then add them and their
    // names to the array that draws the chart
  	this.leagueData.getLeagueData(this.league.id, this.user.id).then(scores => {
  		console.log(scores);
  		this.song1 = scores[0];
  		this.song2 = scores[1];
  		this.song3 = scores[2];
      this.tableData = [
        { data: this.song1, label: '' },
        { data: this.song2, label: '' },
        { data: this.song3, label: '' }
      ];
  	})
    .then(() => {
      this.song1 = this.song1.reduce(this.accumulate, []);
      this.song2 = this.song2.reduce(this.accumulate, []);
      this.song3 = this.song3.reduce(this.accumulate, []);
    })
    .then(() => {
      this.leagueData.getSongNames(this.league.id, this.user.id).then(names => {
        this.lineChartData = [
        { data: this.song1, label: names[0] },
        { data: this.song2, label: names[1] },
        { data: this.song3, label: names[2] }
      ];
      })
    .then(() => {
      console.log(this.lineChartData);
  	})
  	.catch(err => console.log(err));
    });
  }

  ionViewDidLoad() {
    console.log('Hello Analytics Page');
  }

  // accumulate scores so that [0, 1, 1] becomes [0, 1, 2]
  accumulate(r, a){
        if (r.length > 0)
          a += r[r.length - 1];
        r.push(a);
        return r;
      }

  dateToDay(date){
    var dayDict = {"Mon": "Monday",
                  "Tue": "Tuesday",
                  "Wed": "Wednesday",
                  "Thu": "Thursday",
                  "Fri": "Friday",
                  "Sat": "Saturday",
                  "Sun": "Sunday"};

    var day = date.toString().slice(0,3);
    return(day);
  }

  // function to redraw graph and chart for different user
  redraw(user, league, flag){
    this.data_flag = flag;
    this.leagueData.getLeagueData(league.id, user.id).then(scores => {
      console.log(scores);
      this.song1 = scores[0];
      this.song2 = scores[1];
      this.song3 = scores[2];
      this.tableData = [
        { data: this.song1, label: '' },
        { data: this.song2, label: '' },
        { data: this.song3, label: '' }
      ];
    })
    .then(() => {
      this.song1 = this.song1.reduce(this.accumulate, []);
      this.song2 = this.song2.reduce(this.accumulate, []);
      this.song3 = this.song3.reduce(this.accumulate, []);
    })
    .then(() => {
      this.leagueData.getSongNames(league.id, user.id).then(names => {
        this.lineChartData = [
        { data: this.song1, label: names[0] },
        { data: this.song2, label: names[1] },
        { data: this.song3, label: names[2] }
      ];
      console.log(this.lineChartData);
      })
    .then(() => {
      console.log(this.lineChartData);
    })
    .catch(err => console.log(err));
    });
  }


}
