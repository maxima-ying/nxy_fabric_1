package main

import (
	"errors"
	"fmt"
	//"strings"
	"strconv"
	//"reflect"
	//"unsafe"

	"encoding/json"

	"github.com/hyperledger/fabric/core/chaincode/shim"
	//"github.com/hyperledger/fabric/core/crypto/primitives"
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
func (t *Chaincode) Init(stub shim.ChaincodeStubInterface, function string, args []string) ([]byte, error) {
	var err error

	//--------------------------------------------------------------
	// cash

	fmt.Println("[Cash][Init]Start Init")
	fmt.Printf("[Cash][Init]function:%s, args:%#v\n", function, args)

	if len(args) != 4 {
		return nil, errors.New("Bill Init Function[init]:Expecting 4 number of arguments.")
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
		fmt.Printf("[Cash][Init]function:%s, write to ledger failed: key=%s,value=%s\n", function, salerParty, string(salerAccountBytes))
		fmt.Println(err)
		return nil, err
	}
	fmt.Printf("[Cash][Init]function:%s, write to ledger successful: key=%s,value=%s\n", function, salerParty, string(salerAccountBytes))

	buyinAccount := NXYCash{
		Party:      buyinParty,
		CashAmount: buyinPartyCashAmount}
	buyinAccountBytes, _ := json.Marshal(&buyinAccount)
	err = t.saveAccount(stub, &buyinAccount)
	if err != nil {
		fmt.Printf("[Cash][Init]function:%s, write to ledger failed: key=%s,value=%s\n", function, buyinParty, string(buyinAccountBytes))
		fmt.Println(err)
		return nil, err
	}
	fmt.Printf("[Cash][Init]function:%s, write to ledger successful: key=%s,value=%s\n", function, buyinParty, string(buyinAccountBytes))
	fmt.Println("[Cash][Init]End   Init")

	//--------------------------------------------------------------
	// Contract
	fmt.Printf("[Contract][Init][INFO] Start function:%s, args:%#v\n", function, args)

	// table存在check
	var tbl *shim.Table
	tbl, err = stub.GetTable("ContractInfoTBL")
	// table
	if tbl != nil {
		// 程序正常返回
		fmt.Println("[Contract][Init][INFO] table already created")
		fmt.Printf("[Contract][Init][INFO] End function:%s, args:%#v\n", function, args)
		return nil, nil
	}

	// Create ContractInfoTBL table
	err = stub.CreateTable("ContractInfoTBL", []*shim.ColumnDefinition{
		&shim.ColumnDefinition{Name: "number", Type: shim.ColumnDefinition_STRING, Key: true},
		&shim.ColumnDefinition{Name: "ContractInfo", Type: shim.ColumnDefinition_BYTES, Key: false}})
	if err != nil {
		return nil, errors.New("[Contract][Init][ERROR] Failed creating ContractInfoTBL table.")
	}

	// Create table ok
	fmt.Println("[Contract][Init][DEBUG] Create table:ContractInfoTBL success")
	// LOG end
	fmt.Printf("[Contract][Init][INFO] End function:%s\n", function)

	//--------------------------------------------------------------
	// sign
	fmt.Printf("[Cash][Sign]Start Init:function:%s, args:%#v\n", function, args)
	fmt.Printf("[Cash][Sign]End   Init:function:%s, args:%#v\n", function, args)

	return nil, nil
}

func (t *Chaincode) Invoke(stub shim.ChaincodeStubInterface, function string, args []string) ([]byte, error) {

	var err error

	//--------------------------------------------------
	// cash
	/*
	   1. cash的场合
	   调用Chaincode
	   function: transfer
	      args[0]	 fromPartyName        买方机构名
	      args[1]	 toPartyName          卖方机构名
	      args[2]	 transferCash         调用余额
	*/
	if function == "transfer" {
		// LOG start
		fmt.Printf("[cash][Invoke][INFO] Start function:%s, args:%#v\n", function, args)

		if len(args) != 3 {
			return nil, errors.New("Cash Invoke Function[transfer]:Expecting 3 number of arguments.")
		}
		fmt.Println("[Cash][Invoke]Start Invoke %s", function)
		fromPartyName := args[0]
		toPartyName := args[1]
		transferCashStr := args[2]

		transferCash, err := strconv.ParseInt(transferCashStr, 10, 64)
		if err != nil {
			fmt.Printf("[Cash][Invoke]function:%s, convert to int64 failed: value=%s\n", function, transferCashStr)
			fmt.Println(err)
			fmt.Printf("[Cash][Invoke]End   Invoke:function:%s\n", function)
			return nil, err
		}
		fromAccount, err := t.readAccount(stub, fromPartyName)
		if fromAccount == nil {
			fmt.Printf("[Cash][Invoke]function:%s, read ledger failed: key=%s\n", function, fromPartyName)
			fmt.Println(err)
			fmt.Printf("[Cash][Invoke]End   Invoke:function:%s\n", function)
			return nil, err
		}
		toAccount, err := t.readAccount(stub, toPartyName)
		if toAccount == nil {
			fmt.Printf("[Cash][Invoke]function:%s, read ledger failed: key=%s\n", function, toPartyName)
			fmt.Println(err)
			fmt.Printf("[Cash][Invoke]End   Invoke:function:%s\n", function)
			return nil, err
		}
		fromAccountAmount, err := strconv.ParseInt(fromAccount.CashAmount, 10, 64)
		if err != nil {
			fmt.Printf("[Cash][Invoke]function:%s, convert to int64 failed: value=%s\n", function, fromAccount.CashAmount)
			fmt.Println(err)
			fmt.Printf("[Cash][Invoke]End   Invoke:function:%s\n", function)
			return nil, err
		}
		toAccountAmount, err := strconv.ParseInt(toAccount.CashAmount, 10, 64)
		if err != nil {
			fmt.Printf("[Cash][Invoke]function:%s, convert to int64 failed: value=%s\n", function, toAccount.CashAmount)
			fmt.Println(err)
			fmt.Printf("[Cash][Invoke]End   Invoke:function:%s\n", function)
			return nil, err
		}
		fromAccountAmount -= transferCash
		toAccountAmount += transferCash
		// conv int64 to string
		fromAccount.CashAmount = strconv.FormatInt(fromAccountAmount, 10)
		toAccount.CashAmount = strconv.FormatInt(toAccountAmount, 10)
		err = t.saveAccount(stub, fromAccount)
		if err != nil {
			fmt.Printf("[Cash][Invoke]function:%s, write from account ledger failed\n", function)
			fmt.Printf("[Cash][Invoke]End   Invoke:function:%s\n", function)
			return nil, err
		}
		err = t.saveAccount(stub, toAccount)
		if err != nil {
			fmt.Printf("[Cash][Invoke]function:%s, write to  account ledger failed\n", function)
			fmt.Printf("[Cash][Invoke]End   Invoke:function:%s\n", function)
			return nil, err
		}
		fmt.Printf("after cash transfer, fromAccount.CashAmount=%s, toAccount.CashAmount=%s\n", fromAccount.CashAmount, toAccount.CashAmount)
		fmt.Printf("[Cash][Invoke]End Invoke:function:%s,\n", function)
		return nil, nil

	} else if function == "invokeContract" {
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

		// LOG start
		fmt.Printf("[contract][Invoke][INFO] Start function:%s, args:%#v\n", function, args)

		// 入参args的长度check
		if len(args) != 22 {
			return nil, errors.New("[Contract][Invoke][ERROR]Expecting 22 number of arguments.")
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

		fmt.Printf("[Contract][Invoke][DEBUG] function:%s, contractInfoBytes:%s\n", function, contractInfoBytes)

		// Insert into table ContractInfoTBL
		ok, err := stub.InsertRow("ContractInfoTBL", shim.Row{
			Columns: []*shim.Column{
				&shim.Column{Value: &shim.Column_String_{String_: args[1]}},
				&shim.Column{Value: &shim.Column_Bytes{Bytes: contractInfoBytes}}},
		})

		if !ok && err == nil {
			//return nil, errors.New("[Contract][Invoke][ERROR] ContractInfo was already Insert.")
			// 却下/拒绝后， 再次支付申请的场合， 插入会失败（因为上次已经插入），这时候试着去更新一下
			ok, err = stub.ReplaceRow("ContractInfoTBL", shim.Row{
				Columns: []*shim.Column{
					&shim.Column{Value: &shim.Column_String_{String_: args[1]}},
					&shim.Column{Value: &shim.Column_Bytes{Bytes: contractInfoBytes}}},
			})
			//
			if !ok && err == nil {
				return nil, errors.New("[Contract][Invoke][ERROR] fail to update ContractInfo.")
			}
		}

		// Insert error
		if err != nil {
			return nil, errors.New("[Contract][Invoke][ERROR] Failed insert into ContractInfoTBL table.")
		}

		// Insert ok
		fmt.Printf("[Contract][Invoke][DEBUG] Insert into table:ContractInfoTBL success key:%s, value:%s\n", args[1], contractInfoBytes)

		// LOG end
		fmt.Printf("[Contract][Invoke][INFO] End function:%s\n", function)

		return nil, nil

	} else if function == "initStatus" || function == "updateStatus" {
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

		// LOG start
		fmt.Printf("[sign][Invoke][INFO] Start function:%s, args:%#v\n", function, args)

		if len(args) != 3 {
			return nil, errors.New("sign Invoke Expecting 3 number of arguments.")
		}

		number := args[0]
		step := args[1]
		//approved := args[2]

		err = stub.PutState(number, []byte(step))
		if err != nil {
			fmt.Printf("[Sign]write ledger failed: key=%s,value=%s\n", number, step)
			fmt.Println(err)
			return nil, err
		}
		fmt.Printf("[Sign][Invoke]End   Invoke:function:%s\n", function)
		return nil, nil
	} else {
		return nil, errors.New("[Bill][Invoke][ERROR]unknown function.")
	}

}

func (t *Chaincode) Query(stub shim.ChaincodeStubInterface, function string, args []string) ([]byte, error) {
	// LOG start
	fmt.Printf("[Contract][Query][INFO] Start function:%s, args:%#v\n", function, args)

	//-------------------------------------------------
	// contract
	// args[0]  number	 (票据号码)
	if function == "queryContract" {

		//return nil, nil

		// 入参长度check
		if len(args) != 1 {
			return nil, errors.New("[Contract][Query][ERROR]Expecting 1 number of arguments.")
		}

		// 入参取得
		number := args[0]

		var columns []shim.Column
		col1 := shim.Column{Value: &shim.Column_String_{String_: number}}
		columns = append(columns, col1)

		// 数据取得
		row, err := stub.GetRow("ContractInfoTBL", columns)
		if err != nil {
			fmt.Printf("[Contract][query][ERROR] Failed retriving number [%s]: [%s]", string(number), err)
			return nil, errors.New("[Contract][query][ERROR] Failed retriving number")
		}

		// LOG end
		fmt.Printf("[Contract][query][INFO] Query done data count: [% x]", len(row.Columns))
		fmt.Printf("[Contract][query][INFO] Query done data: [% x]", row.Columns[1].GetBytes())

		return row.Columns[1].GetBytes(), nil

		//-------------------------------------------------
		// cash
		// args[0]	party
		// return	{"party":"","cashAmount":""}
	} else if function == "queryAccount" {

		if len(args) != 1 {
			return nil, errors.New("Cash Query Expecting 1 number of arguments.")
		}
		party := args[0]
		account, err := t.readAccount(stub, party)
		if err != nil {
			jsonResp := "{\"Error\":\"Failed to get state for " + party + "\"}"
			fmt.Printf("[Cash][Query]End   Query:function:%s\n", function)
			return nil, errors.New(jsonResp)
		}
		accountBytes, _ := json.Marshal(account)
		fmt.Printf("[Cash][Query]End   Query:function:%s, account=%s\n", function, string(accountBytes))
		return accountBytes, nil

		//-------------------------------------------------
		// sign
		// args[0]	number		票号
	} else if function == "queryStatus" {
		if len(args) != 1 {
			return nil, errors.New("sign Query Expecting 1 number of arguments.")
		}
		number := args[0]

		stepBytes, err := stub.GetState(number)
		if err != nil {
			jsonResp := "{\"Error\":\"Failed to get state for " + number + "\"}"
			return nil, errors.New(jsonResp)
		}
		if stepBytes == nil {
			jsonResp := "{\"Error\":\"stepName is Nil for " + number + "\"}"
			return nil, errors.New(jsonResp)
		}
		step := string(stepBytes)
		jsonResp := "{\"Number\":\"" + number + "\",\"stepName\":\"" + step + "\"}"

		fmt.Printf("Query Response:%s\n", jsonResp)
		return []byte(jsonResp), nil
	} else {
		return nil, errors.New("[Bill][Invoke][ERROR]unknown function.")
	}

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
