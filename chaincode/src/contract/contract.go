package main

import (
	"errors"
	"fmt"
	//"strings"
	//"strconv"
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

// args[0]	party	 (所属机构)
// 1  party		 (票据号码)
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
func (t *Chaincode) Init(stub shim.ChaincodeStubInterface, function string, args []string) ([]byte, error) {
	// LOG start
	fmt.Printf("[Contract][Init][INFO] Start function:%s, args:%#v\n", function, args)

	// table存在check
	var tbl *shim.Table
	var err error
	tbl, err = stub.GetTable("ContractInfoTBL")
	// table
	if tbl != nil {
		// 程序正常返回
		fmt.Println("[Contract][Init][INFO] table already created")
		fmt.Printf("[Contract][Init][INFO] End function:%s, args:%#v\n", function, args)
		return nil, nil
	}
	fmt.Println("aaa")
	stub.GetTable("ContractInfoTBL")
	fmt.Println("bbb")
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

	return nil, nil
}

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
func (t *Chaincode) Invoke(stub shim.ChaincodeStubInterface, function string, args []string) ([]byte, error) {

	// LOG start
	fmt.Printf("[Contract][Invoke][INFO] Start function:%s, args:%#v\n", function, args)

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

}

// args[0]  number	 (票据号码)
func (t *Chaincode) Query(stub shim.ChaincodeStubInterface, function string, args []string) ([]byte, error) {
	// LOG start
	fmt.Printf("[Contract][Query][INFO] Start function:%s, args:%#v\n", function, args)

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
		fmt.Printf("[Contract][Query][ERROR] Failed retriving number [%s]: [%s]", string(number), err)
		return nil, errors.New("[Contract][Query][ERROR] Failed retriving number")
	}

	// LOG end
	fmt.Printf("[Contract][Query][INFO] Query done data count: [% x]", len(row.Columns))
	fmt.Printf("[Contract][Query][INFO] Query done data: [% x]", row.Columns[1].GetBytes())

	return row.Columns[1].GetBytes(), nil

}

func main() {
	err := shim.Start(new(Chaincode))
	if err != nil {
		fmt.Printf("Error starting contract chaincode: %s", err)
	}
}
