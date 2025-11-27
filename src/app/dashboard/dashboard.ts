import { Component } from '@angular/core';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  templateUrl: './dashboard.html',
  styleUrls: ['./dashboard.scss'],
})
export class Dashboard {

  totalUsers = 0;
  totalRoles = 0;

  constructor(private http: HttpClient) {}

  ngOnInit() {
    this.loadStats();
  }


  //to show the number of the total users and the total roles
  loadStats() {

    // GET total Users
    this.http.get<any>('https://localhost:7065/api/User/count-users')
      .subscribe(res => {
        this.totalUsers = res?.total ?? 0;
      });

    // GET total Roles
    this.http.get<any>('https://localhost:7065/api/Role/count-roles')
      .subscribe(res => {
        this.totalRoles = res?.total ?? 0;
      });
  }

  
}
