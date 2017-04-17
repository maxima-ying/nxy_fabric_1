#复制 test_hfc 目录到 $GOPATH\src\github.com\hyperledger\fabric_1.0_alpha\workspace\
#也就是 $GOPATH\src\github.com\hyperledger\fabric_1.0_alpha\workspace\test_hfc 下面

vagrant ssh

#cd /opt/gopath/src/github.com/hyperledger/fabric_1.0_alpha/workspace/test_hfc
#cd /opt/gopath/src/github.com/hyperledger/fabric/workspace/test_hfc
cd ../fabric-sdk-node/test/fixtures

docker-compose down

docker rmi -f dev-peer0-bill-v0

docker-compose up --force-recreate -d





=======restart==================

#1.删除临时文件：把下面两个目录里的文件都删掉

C:\tmp
C:\Users\IBM_ADMIN\.hfc-key-store

#2.清理工程目录下的chaincode.json文件
{"bill":"bill"}  改为   {}     
注意点：a. 把json文件中的"bill"项删掉或者改名即可。
        b. 全删掉不行，一定要留个{}在文件里。


#clear VM side
docker-compose down

docker rmi -f peer0-peer0-myexccc1-1.0

docker-compose up --force-recreate -d


===========测试功能============


#http://127.0.0.1:8100/chaincode/init


http://127.0.0.1:8100/test/chaincode/query/


http://127.0.0.1:8100/test/chaincode/invoke/