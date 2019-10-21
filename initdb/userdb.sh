
cat <<EOF | mongo -u ${MONGO_INITDB_ROOT_USERNAME} -p ${MONGO_INITDB_ROOT_PASSWORD}
use ${MONGO_INITDB_DATABASE};
db.createUser({
   user: "${MONGO_USERDB_WEBUSER}",
   pwd: "${MONGO_USERDB_WEBPASS}",
   roles: [ { role: "readWrite", db: "${MONGO_INITDB_DATABASE}" } ]
});

db.users.createIndex( { "username": 1 }, { unique: true } );
EOF
