#���� test_hfc Ŀ¼�� $GOPATH\src\github.com\hyperledger\fabric_1.0_alpha\workspace\
#Ҳ���� $GOPATH\src\github.com\hyperledger\fabric_1.0_alpha\workspace\test_hfc ����

vagrant ssh

#cd /opt/gopath/src/github.com/hyperledger/fabric_1.0_alpha/workspace/test_hfc
#cd /opt/gopath/src/github.com/hyperledger/fabric/workspace/test_hfc
cd ../fabric-sdk-node/test/fixtures

docker-compose down

docker rmi -f dev-peer0-bill-v0

docker-compose up --force-recreate -d





=======restart==================

#1.ɾ����ʱ�ļ�������������Ŀ¼����ļ���ɾ��

C:\tmp
C:\Users\IBM_ADMIN\.hfc-key-store

#2.������Ŀ¼�µ�chaincode.json�ļ�
{"bill":"bill"}  ��Ϊ   {}     
ע��㣺a. ��json�ļ��е�"bill"��ɾ�����߸������ɡ�
        b. ȫɾ�����У�һ��Ҫ����{}���ļ��


#clear VM side
docker-compose down

docker rmi -f peer0-peer0-myexccc1-1.0

docker-compose up --force-recreate -d


===========���Թ���============


#http://127.0.0.1:8100/chaincode/init


http://127.0.0.1:8100/test/chaincode/query/


http://127.0.0.1:8100/test/chaincode/invoke/