#!/bin/bash

DATE_NOW=`date +%Y-%m-%d`
MONTH_DAY=`date +2003-%m-%d`


#curl -i -H "Content-Type: application/json" -X PUT -d '{"dateOfBirth":"2000-01-01"}' http://localhost:8000/hello/username
#curl -X GET http://127.0.0.1:8000/hello/username

echo -ne "\nTest for alpha only username checks... "
curl -H "Content-Type: application/json" -X PUT -d '{"dateOfBirth":"2009-01-01"}' http://localhost:8000/hello/badu5ername
echo 
echo -n "Try sending today's date - $DATE_NOW... "
curl -H "Content-Type: application/json" -X PUT -d "{\"dateOfBirth\":\"${DATE_NOW}\"}" http://localhost:8000/hello/username
echo 
echo -n "Storing data for john... "
curl -H "Content-Type: application/json" -X PUT -d '{"dateOfBirth":"2009-01-01"}' http://localhost:8000/hello/john
echo 
echo -n "Storing data for michael... "
curl -H "Content-Type: application/json" -X PUT -d '{"dateOfBirth":"2009-12-01"}' http://localhost:8000/hello/michael
echo 
echo -n "Storing data for katie.. "
curl -H "Content-Type: application/json" -X PUT -d "{\"dateOfBirth\":\"${MONTH_DAY}\"}" http://localhost:8000/hello/katie
echo 

echo -n "Retrieving for john.. "
curl -X GET http://localhost:8000/hello/john
echo 
echo -n "Retrieving for michael.. "
curl -X GET http://localhost:8000/hello/michael
echo 
echo -n "Retrieving for katie.. "
curl -X GET http://localhost:8000/hello/katie
echo 
