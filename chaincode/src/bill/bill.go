package main

import (
	"fmt"
	"strconv"

	"github.com/hyperledger/fabric/core/chaincode/shim"
	pb "github.com/hyperledger/fabric/protos/peer"

	"encoding/json"
)

// Chaincode example simple Chaincode implementation
type Chaincode struct {
}

/*
农信银Demo账户账本
Party : 机构名
CashAmount  ：机构账户余额
*/
type NXYCash struct {
	Party      string `json:"party"`
	CashAmount string `json:"cashAmount"`
}

/*
农信银Demo合同
Party		 (所属机构)
Number		 (票据号码)
Attribute	 (票据属性)		--纸票、电票
BillType	 (票据类型)		--银票、商票
IssuerName	 (出票人名称)		--支持最长 60 个汉字
IssuerAccountID	 (出票人账户)
IssuerAccountBankID (出票人开户行行号)	--银票为承兑行;商票为出票人开户行
CustodianName	 (收票人名称)		--支持最长 60 个汉字
CustodianAccountID (收票人账户)
CustodianAccountBankID (收票人开户行行号)	--12 位数字
FaceAmount	 (票面金额)		--纸票票面最大为 3 千万,电票票面最大为 10 亿;
AcceptorName	 (承兑人名称)		--支持最长 60 个汉字
AcceptorAccountID (承兑人账号)
AcceptorBankID	 (承兑人开户行行号)	--12 位数字
IssueDate	 (出票日期)		--票据出票日期
DueDate		 (到期日期)		--商业汇票到期日
AcceptDate	 (承兑日期)
PayBankID	 (付款行行号)
TransferableFlag (转让标识)		--可转让;不可转让
SalerParty	 (卖方机构)
BuyinParty	 (买方机构)
DealAmount	 (成交价格)
*/
type NXYContract struct {
	Party                  string `json:"party"`
	Number                 string `json:"number"`
	Attribute              string `json:"attribute"`
	BillType               string `json:"billType"`
	IssuerName             string `json:"issuerName"`
	IssuerAccountID        string `json:"issuerAccountID"`
	IssuerAccountBankID    string `json:"issuerAccountBankID"`
	CustodianName          string `json:"custodianName"`
	CustodianAccountID     string `json:"custodianAccountID"`
	CustodianAccountBankID string `json:"custodianAccountBankID"`
	FaceAmount             string `json:"faceAmount"`
	AcceptorName           string `json:"acceptorName"`
	AcceptorAccountID      string `json:"acceptorAccountID"`
	AcceptorBankID         string `json:"acceptorBankID"`
	IssueDate              string `json:"issueDate"`
	DueDate                string `json:"dueDate"`
	DcceptDate             string `json:"dcceptDate"`
	PayBankID              string `json:"payBankID"`
	TransferableFlag       string `json:"transferableFlag"`
	SalerParty             string `json:"salerParty"`
	BuyinParty             string `json:"buyinParty"`
	DealAmount             string `json:"dealAmount"`
}

/*
部署Chaincode并写入余额
   args[0]	 salerParty             买方机构名
   args[1]	 salerPartycashAmount   买方机构余额
   args[2]	 buyinParty             卖方机构名
   args[3]	 buyinPartycashAmount   卖方机构余额
*/
func (t *Chaincode) Init(stub shim.ChaincodeStubInterface) pb.Response {
	var err error

	//--------------------------------------------------------------
	// cash

	fmt.Println("[Cash][Init]Start Init")

	_, args := stub.GetFunctionAndParameters()

	fmt.Printf("[Cash][Init]function:Init, args:%#v\n", args)

	if len(args) != 4 {
		return shim.Error("Bill Init Function[init]:Expecting 4 number of arguments.")
	}

	salerParty := args[0]
	salerPartyCashAmount := args[1]
	buyinParty := args[2]
	buyinPartyCashAmount := args[3]

	salerAccount := NXYCash{
		Party:      salerParty,
		CashAmount: salerPartyCashAmount}
	salerAccountBytes, _ := json.Marshal(&salerAccount)
	err = t.saveAccount(stub, &salerAccount)

	if err != nil {
		fmt.Printf("[Cash][Init]function:Init, write to ledger failed: key=%s,value=%s\n", salerParty, string(salerAccountBytes))
		fmt.Println(err.Error())
		return shim.Error(err.Error())
	}
	fmt.Printf("[Cash][Init]function:Init, write to ledger successful: key=%s,value=%s\n", salerParty, string(salerAccountBytes))

	buyinAccount := NXYCash{
		Party:      buyinParty,
		CashAmount: buyinPartyCashAmount}
	buyinAccountBytes, _ := json.Marshal(&buyinAccount)
	err = t.saveAccount(stub, &buyinAccount)
	if err != nil {
		fmt.Printf("[Cash][Init]function:Init, write to ledger failed: key=%s,value=%s\n", buyinParty, string(buyinAccountBytes))
		fmt.Println(err.Error())
		return shim.Error(err.Error())
	}
	fmt.Printf("[Cash][Init]function:Init, write to ledger successful: key=%s,value=%s\n", buyinParty, string(buyinAccountBytes))
	fmt.Println("[Cash][Init]End   Init")

	//--------------------------------------------------------------
	// Contract
	fmt.Printf("[Contract][Init][INFO] Start function:Init, args:%#v\n", args)
	// LOG end
	fmt.Printf("[Contract][Init][INFO] End function:Init\n")

	//--------------------------------------------------------------
	// sign
	fmt.Printf("[Cash][Sign]Start Init:function:Init, args:%#v\n", args)
	fmt.Printf("[Cash][Sign]End   Init:function:Init, args:%#v\n", args)

	return shim.Success(nil)
}

func (t *Chaincode) Invoke(stub shim.ChaincodeStubInterface) pb.Response {
	function, args := stub.GetFunctionAndParameters()

	if function == "transfer" {
		// cash的场合
		return t.invokeCash(stub, args)

	} else if function == "invokeContract" {
		// contract的场合
		return t.invokeContract(stub, args)

	} else if function == "initStatus" || function == "updateStatus" {
		// sign的场合
		return t.invokeSign(stub, args)

	} else if function == "queryContract" {
		// contract的场合
		return t.queryContract(stub, args)

	} else if function == "queryAccount" {
		// cash的场合
		return t.queryCash(stub, args)

	} else if function == "queryStatus" {
		// sign的场合
		return t.querySign(stub, args)

	}

	//return shim.Error("Invalid invoke function name. function:" + function + "args:" + args[0])
	return shim.Error("Invalid invoke function name. function:")
}

//--------------------------------------------------
// cash
/*
	 1. invokeCash
	 调用Chaincode
	 function: transfer
			args[0]	 fromPartyName        买方机构名
			args[1]	 toPartyName          卖方机构名
			args[2]	 transferCash         调用余额
*/
func (t *Chaincode) invokeCash(stub shim.ChaincodeStubInterface, args []string) pb.Response {

	var err error

	// LOG start
	fmt.Printf("[cash][Invoke][INFO] Start function:invokeCash, args:%#v\n", args)

	if len(args) != 3 {
		return shim.Error("Cash Invoke Function[transfer]:Expecting 3 number of arguments.")
	}
	fmt.Println("[Cash][Invoke]Start Invoke invokeCash")
	fromPartyName := args[0]
	toPartyName := args[1]
	transferCashStr := args[2]

	transferCash, err := strconv.ParseInt(transferCashStr, 10, 64)
	if err != nil {
		fmt.Printf("[Cash][Invoke]function:invokeCash, coinvokeCashnvert to int64 failed: value=%s\n", transferCashStr)
		fmt.Println(err.Error())
		fmt.Printf("[Cash][Invoke]End   Invoke:function:invokeCash\n")
		return shim.Error(err.Error())
	}
	fromAccount, err := t.readAccount(stub, fromPartyName)
	if fromAccount == nil {
		fmt.Printf("[Cash][Invoke]function:invokeCash, read ledger failed: key=%s\n", fromPartyName)
		fmt.Println(err.Error())
		fmt.Printf("[Cash][Invoke]End   Invoke:function:invokeCash\n")
		return shim.Error(err.Error())
	}
	toAccount, err := t.readAccount(stub, toPartyName)
	if toAccount == nil {
		fmt.Printf("[Cash][Invoke]function:invokeCash, read ledger failed: key=%s\n", toPartyName)
		fmt.Println(err.Error())
		fmt.Printf("[Cash][Invoke]End   Invoke:function:invokeCash\n")
		return shim.Error(err.Error())
	}
	fromAccountAmount, err := strconv.ParseInt(fromAccount.CashAmount, 10, 64)
	if err != nil {
		fmt.Printf("[Cash][Invoke]function:invokeCash, convert to int64 failed: value=%s\n", fromAccount.CashAmount)
		fmt.Println(err.Error())
		fmt.Printf("[Cash][Invoke]End   Invoke:function:invokeCash\n")
		return shim.Error(err.Error())
	}
	toAccountAmount, err := strconv.ParseInt(toAccount.CashAmount, 10, 64)
	if err != nil {
		fmt.Printf("[Cash][Invoke]function:invokeCash, convert to int64 failed: value=%s\n", toAccount.CashAmount)
		fmt.Println(err.Error())
		fmt.Printf("[Cash][Invoke]End   Invoke:function:invokeCash\n")
		return shim.Error(err.Error())
	}
	fromAccountAmount -= transferCash
	toAccountAmount += transferCash
	// conv int64 to string
	fromAccount.CashAmount = strconv.FormatInt(fromAccountAmount, 10)
	toAccount.CashAmount = strconv.FormatInt(toAccountAmount, 10)
	err = t.saveAccount(stub, fromAccount)
	if err != nil {
		fmt.Printf("[Cash][Invoke]function:invokeCash, write from account ledger failed\n")
		fmt.Printf("[Cash][Invoke]End   Invoke:function:invokeCash\n")
		return shim.Error(err.Error())
	}
	err = t.saveAccount(stub, toAccount)
	if err != nil {
		fmt.Printf("[Cash][Invoke]function:invokeCash, write to  account ledger failed\n")
		fmt.Printf("[Cash][Invoke]End   Invoke:function:invokeCash\n")
		return shim.Error(err.Error())
	}
	fmt.Printf("after cash transfer, fromAccount.CashAmount=%s, toAccount.CashAmount=%s\n", fromAccount.CashAmount, toAccount.CashAmount)
	fmt.Printf("[Cash][Invoke]End Invoke:function:invokeCash,\n")

	return shim.Success(nil)
}

//--------------------------------------------------
// contract
// 2. contract的场合
// args[0]	party	 (所属机构)
// 1  number		 (票据号码)
// 2  attribute		 (票据属性)		--纸票、电票
// 3  billType		 (票据类型)		--银票、商票
// 4  issuerName	 (出票人名称)		--支持最长 60 个汉字
// 5  issuerAccountID	 (出票人账户)
// 6  issuerAccountBankID (出票人开户行行号)	--银票为承兑行;商票为出票人开户行
// 7  custodianName	 (收票人名称)		--支持最长 60 个汉字
// 8  custodianAccountID (收票人账户)
// 9  custodianAccountBankID (收票人开户行行号)	--12 位数字
// 10 faceAmount	 (票面金额)		--纸票票面最大为 3 千万,电票票面最大为 10 亿;
// 11 acceptorName	 (承兑人名称)		--支持最长 60 个汉字
// 12 acceptorAccountID (承兑人账号)
// 13 acceptorBankID	 (承兑人开户行行号)	--12 位数字
// 14 issueDate		 (出票日期)		--票据出票日期
// 15 dueDate		 (到期日期)		--商业汇票到期日
// 16 acceptDate	 (承兑日期)
// 17 payBankID		 (付款行行号)
// 18 transferableFlag	 (转让标识)		--可转让;不可转让
// 19 salerParty	 (卖方机构)
// 20 buyinParty	 (买方机构)
// 21 dealAmount	 (成交价格)
func (t *Chaincode) invokeContract(stub shim.ChaincodeStubInterface, args []string) pb.Response {
	var err error

	// LOG start
	fmt.Printf("[contract][Invoke][INFO] Start function:invokeContract, args:%#v\n", args)

	// 入参args的长度check
	if len(args) != 22 {
		return shim.Error("[Contract][Invoke][ERROR]Expecting 22 number of arguments.")
	}

	// 入参args[]的情报,json格式转换
	contractInfo := NXYContract{
		Party:                  args[0],
		Number:                 args[1],
		Attribute:              args[2],
		BillType:               args[3],
		IssuerName:             args[4],
		IssuerAccountID:        args[5],
		IssuerAccountBankID:    args[6],
		CustodianName:          args[7],
		CustodianAccountID:     args[8],
		CustodianAccountBankID: args[9],
		FaceAmount:             args[10],
		AcceptorName:           args[11],
		AcceptorAccountID:      args[12],
		AcceptorBankID:         args[13],
		IssueDate:              args[14],
		DueDate:                args[15],
		DcceptDate:             args[16],
		PayBankID:              args[17],
		TransferableFlag:       args[18],
		SalerParty:             args[19],
		BuyinParty:             args[20],
		DealAmount:             args[21]}
	// json对象bytes转换
	contractInfoBytes, _ := json.Marshal(&contractInfo)

	fmt.Printf("[Contract][Invoke][DEBUG] function:invokeContract, contractInfoBytes:%s\n", contractInfoBytes)

	err = stub.PutState(args[1], contractInfoBytes)
	if err != nil {
		fmt.Printf("[Contract][Invoke][ERROR]write ledger failed: key=%s,value=%s\n", args[1], string(contractInfoBytes))
		fmt.Println(err.Error())
		return shim.Error(err.Error())
	}

	//  ok
	fmt.Printf("[Contract][Invoke][DEBUG] write ledger success key:%s, value:%s\n", args[1], contractInfoBytes)

	// LOG end
	fmt.Printf("[Contract][Invoke][INFO] End function:invokeContract\n")

	return shim.Success(nil)

}

//--------------------------------------------------
// sign
// sign的场合
// args[0] number		票号
// args[1] stepName		当前流程号
// args[2] approved 	批准 "0": rejected, "1":approved
// 当前流程号：
//		01 custodianPublish 	(票据托管)
//		02 custodianAccept	(接受托管)
//		03 onsaleApplication 	(卖方提出申请)
//		04 salerPartyReview 	(卖方复核)
//		05 salerPartyApproval(卖方审批)
//		06 buyinPartyCheck 	(买方审核)
//		07 buyinPartyApproval(买方审批)
//		08 settlement 	(清算处理，所有权变更)
func (t *Chaincode) invokeSign(stub shim.ChaincodeStubInterface, args []string) pb.Response {

	var err error

	// LOG start
	fmt.Printf("[sign][Invoke][INFO] Start function:invokeSign, args:%#v\n", args)

	if len(args) != 3 {
		return shim.Error("sign Invoke Expecting 3 number of arguments.")
	}

	number := args[0]
	step := args[1]
	//approved := args[2]

	err = stub.PutState(number, []byte(step))
	if err != nil {
		fmt.Printf("[Sign]write ledger failed: key=%s,value=%s\n", number, step)
		fmt.Println(err.Error())
		return shim.Error(err.Error())
	}

	fmt.Printf("[Sign][Invoke]End   Invoke:function:invokeSign\n")

	return shim.Success(nil)

}

//-------------------------------------------------
// contract
// args[0]  number	 (票据号码)
func (t *Chaincode) queryContract(stub shim.ChaincodeStubInterface, args []string) pb.Response {
	var err error

	// LOG start
	fmt.Printf("[Contract][Query][INFO] Start function:queryContract, args:%#v\n", args)

	// 入参长度check
	if len(args) != 1 {
		return shim.Error("[Contract][Query][ERROR]Expecting 1 number of arguments.")
	}

	// 入参取得
	number := args[0]

	// Get the state from the ledger
	Avalbytes, err := stub.GetState(string(number))
	if err != nil {
		fmt.Printf("[Contract][query][ERROR] Failed retriving number [%s]: [%s]", string(number), err)
		return shim.Error("[Contract][query][ERROR] Failed retriving number")
	}

	if Avalbytes == nil {
		jsonResp := "{\"Error\":\"Nil amount for " + string(number) + "\"}"
		return shim.Error(jsonResp)
	}

	// LOG end
	fmt.Printf("[Contract][query][INFO] Query done data: [%s]", string(Avalbytes))

	return shim.Success(Avalbytes)
}

//-------------------------------------------------
// cash
// args[0]	party
// return	{"party":"","cashAmount":""}
func (t *Chaincode) queryCash(stub shim.ChaincodeStubInterface, args []string) pb.Response {
	var err error

	if len(args) != 1 {
		return shim.Error("Cash Query Expecting 1 number of arguments.")
	}
	party := args[0]
	account, err := t.readAccount(stub, party)
	if err != nil {
		jsonResp := "{\"Error\":\"Failed to get state for " + party + "\"}"
		fmt.Printf("[Cash][Query]End   Query:function:queryCash\n")
		return shim.Error(jsonResp)
	}
	accountBytes, _ := json.Marshal(account)
	fmt.Printf("[Cash][Query]End   Query:function:queryCash, account=%s\n", string(accountBytes))

	return shim.Success(accountBytes)
}

//-------------------------------------------------
// sign
// args[0]	number		票号
func (t *Chaincode) querySign(stub shim.ChaincodeStubInterface, args []string) pb.Response {
	var err error

	if len(args) != 1 {
		return shim.Error("sign Query Expecting 1 number of arguments.")
	}
	number := args[0]

	stepBytes, err := stub.GetState(number)
	if err != nil {
		jsonResp := "{\"Error\":\"Failed to get state for " + number + "\"}"
		return shim.Error(jsonResp)
	}
	if stepBytes == nil {
		jsonResp := "{\"Error\":\"stepName is Nil for " + number + "\"}"
		return shim.Error(jsonResp)
	}
	step := string(stepBytes)
	jsonResp := "{\"Number\":\"" + number + "\",\"stepName\":\"" + step + "\"}"

	fmt.Printf("Query Response:%s\n", jsonResp)

	return shim.Success([]byte(jsonResp))
}

/*
读取Account
*/
func (t *Chaincode) readAccount(stub shim.ChaincodeStubInterface, accountName string) (*NXYCash, error) {
	var err error
	account := &NXYCash{}
	accountBytes, err := stub.GetState(accountName)
	if err != nil {
		fmt.Printf("[Cash]read ledger failed: key=%s. Continue\n", accountName)
		fmt.Println(err)
		return nil, err
	}
	fmt.Printf("[Cash]read ledger successfully: key=%s.value=%s\n", accountName, string(accountBytes))
	err = json.Unmarshal(accountBytes, account)
	if err != nil {
		fmt.Printf("[Cash]convert to struct NXYCash failed\n")
		fmt.Println(err)
		return nil, err
	}
	return account, nil
}

/*
写入Account
*/
func (t *Chaincode) saveAccount(stub shim.ChaincodeStubInterface, account *NXYCash) error {
	var err error
	jsonStr, _ := json.Marshal(account)
	err = stub.PutState(account.Party, jsonStr)
	if err != nil {
		fmt.Printf("[Cash]write ledger failed: key=%s,value=%s\n", account.Party, string(jsonStr))
		fmt.Println(err)
		return err
	}
	return nil
}

func main() {
	err := shim.Start(new(Chaincode))
	if err != nil {
		fmt.Printf("Error starting bill chaincode: %s", err)
	}
}
