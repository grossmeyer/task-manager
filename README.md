# task-manager
Task Manager App based on Mead.IO NodeJS Course

[Original repo created by Andrew Mead](https://github.com/andrewjmead/node-course-v3-code/tree/master/task-manager)

## Overview

This application is a relatively simple program that allows an authenticated user to perform CRUD operations on tasks related to the user. It does so via an API served up by NodeJS.

The functionality of the application code is extremely similar to the original source provided by Andrew, however I went much further with the testing in Jest/Supertest. Andrew splits up his test files by both User and Task, however because I wrote additional test cases, the individual files started getting very long. I opted to break these up further by the specific API routes, i.e., POST, GET, PATCH, and DELETE. My test data and testing process are more rigorous and robust due to the requirements of the additional tests. In the User Model I also added a helper function to assist with my unit tests that Andrew's tests had no need for. This is getBearerToken(). 

Throughout the code, I use destructuring more liberally than Andrew (by liberally, I really mean as much as possible!).

The tasks are written to a MongoDB NoSQL database stored in MongoDB Atlas, however they could be stored locally if desired. I used Mongoose to make some of the Mongo operations a bit easier (same as Andrew), however I added a helper function, checkId(), in both the User and Task models to remove the explicit need for Mongoose in my routers. I wouldn't even need Mongoose in the routers in the first place, but I have more explicit error-checking on various routes in order to catch some edge cases I thought about. Andrew's code and lessons do not cover these.

This project did an excellent job at getting me familiar with unit testing and creating ExpressJS routes using JWT auth middleware. I highly recommend purchasing Andrew Mead's NodeJS course by visiting [his website](https://mead.io).
