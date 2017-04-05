package main

import (
	"encoding/json"
	"errors"
	"fmt"
	"strconv"

	"github.com/hyperledger/fabric/core/chaincode/shim"
)

// Chaincode example simple Chaincode implementation
type CashChaincode struct {
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
部署Chaincode并写入余额
   args[0]	 salerParty             买方机构名
   args[1]	 salerPartycashAmount   买方机构余额
   args[2]	 buyinParty             卖方机构名
   args[3]	 buyinPartycashAmount   卖方机构余额
*/
func (t *CashChaincode) Init(stub shim.ChaincodeStubInterface, function string, args []string) ([]byte, error) {
	var err error

	fmt.Println("[Cash][Init]Start Init")
	fmt.Printf("[Cash][Init]function:%s, args:%#v\n", function, args)

	if len(args) != 4 {
		return nil, errors.New("Cash Init Function[init]:Expecting 4 number of arguments.")
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
	return nil, nil
}

/*
调用Chaincode
function: transfer
   args[0]	 fromPartyName        买方机构名
   args[1]	 toPartyName          卖方机构名
   args[2]	 transferCash         调用余额
*/
func (t *CashChaincode) Invoke(stub shim.ChaincodeStubInterface, function string, args []string) ([]byte, error) {
	fmt.Printf("[Cash][Invoke]Start Invoke:function:%s, args:%#v\n", function, args)

	if function == "transfer" {
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
	}
	fmt.Printf("[Cash][Invoke]Start Invoke:function:%s, args:%#v\n", function, args)
	return nil, nil

}

/*
读取Account
*/
func (t *CashChaincode) readAccount(stub shim.ChaincodeStubInterface, accountName string) (*NXYCash, error) {
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
func (t *CashChaincode) saveAccount(stub shim.ChaincodeStubInterface, account *NXYCash) error {
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

// args[0]	party
// return	{"party":"","cashAmount":""}
/*
读取账户
function: queryAccount
*/
func (t *CashChaincode) Query(stub shim.ChaincodeStubInterface, function string, args []string) ([]byte, error) {
	fmt.Printf("[Cash][Query]Start Query:function:%s, args:%#v\n", function, args)

	if function == "queryAccount" {

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
	}
	fmt.Printf("[Cash][Query]End   Query:function:%s\n", function)
	jsonResp := "{\"Error\":\"Unknown function:" + function + "\"}"
	return []byte(jsonResp), nil
}

func main() {
	err := shim.Start(new(CashChaincode))
	if err != nil {
		fmt.Printf("Error starting Cash chaincode: %s", err)
	}
}
