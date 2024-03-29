## 1. The app.
Task: design and code simple "Hello world" application that exposes PUT/GET HTTP API for user's birthdate storing and retrieval. For full task description see [tasks.txt](tasks.txt).

**Concept**: since we are sending and receiving json key-values it makes sense to use doc storage such as Mongodb. I chose Node.js as a quick way to implement [API solution](index.js). Also Node.js is one of supported languages to create serverless apps/lambdas on AWS therefore it suits task context. 
In code I decided not to use *express*, *jsonbody* or other libraries and go with just Node.js core + mongo lib (as there is no way around it). Since logic is simple I used callbacks and did not exported my functions outside main file to keep all logic visible in place. In real world module exports are usualy done to create *proper* per function unit tests later.

### architecture and start
Architecture consists of haproxy balancer->nodejs->mongodb containers. They are built with [docker-compose](docker-compose.yml). It is possible to scale and add more nodejs containers/instances, and balancer in front will split trafic across them. There is *webnetwork* between balancer and nodejs "webnodes" and *dbnetwork* between nodejs and mongo to segregate security scopes and accessability between servers. Preview of possible deployment logic is in node service, but it works with swarm only. Upon setup of mongodb root and webapp passwords are set, also [index](initdb/userdb.sh) is set up on *username* for *user* collection. Idea for simplification is that username must be unique to retrieve only 1 record describing particular "person".

Start as usual:
```
git clone https://github.com/codedumper1/hello-api.git
cd hello-api
```
if you already have direnv, then simply do 
`direnv allow` else `source .envrc` and `docker-compose up`. This will bring 3 containers. Entry point is http://127.0.0.1:8000.

To scale/add 2 more "webnodes", run `docker-compose scale node=3`
You can see balanced picked up new nodes via haproxy stats screen http://127.0.0.1:1936, user: stats, pw:stats

## 2. solution on AWS

**serverless:**<br>
principal schema: request -> Amazon API gateway -> Amazon Lambda -> Amazon Dynamo DB<br>
where
- API gateway - defines routes/resources and request methods;
- Lambda - code itself, triggered on event. We reuse functions *processPUT* and *processGET* from out code, add sdk libs, pack to .zip and ship as lambda package;
- Dynamo DB - key-value DB to store our data.

**EC2 based:**<br>
principal schema: request -> Elastic Load balancer -> EC2 instance(s) -> Dynamo DB<br>
where Amazon balancer dispatches requests among EC2 compute instances that use Dynamo DB for key-value storage.

**traditional:**<br>
EC2 instance per role - i.e. balancer (if any), webnode(s) and nosql server(s).

## 3. testing and automation

[test.sh](test.sh) checks for task  requirements and stores/retrieves test data.<br>
[docker-compose.yml](docker-compose.yml) orchestrates deployment of whole solution.
```
$ ./test.sh 

Test for alpha only username checks... 400 Bad Request

Try sending today's date - 2019-10-21... 400 Bad Request

Storing date 2009-01-01 for john...
Storing date 2009-12-01 for michael...
Storing date 2003-10-21 for katie..
Retrieving for john.. { "message": "Hello, john! Your birthday is in 71 day(s)" }

Retrieving for michael.. { "message": "Hello, michael! Your birthday is in 40 day(s)" }

Retrieving for katie.. { "message": "Hello, katie! Happy birthday!" }
```

to put value manually (change username, duplicate won't be accepted by mongo - index): 

`curl -H "Content-Type: application/json" -X PUT -d '{"dateOfBirth":"2009-01-01"}' http://localhost:8000/hello/john`

to get value manually:
`curl -X GET http://localhost:8000/hello/john`

