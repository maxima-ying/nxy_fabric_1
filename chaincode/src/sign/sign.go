package main

import (
	"errors"
	"fmt"

	"github.com/hyperledger/fabric/core/chaincode/shim"
)

// Chaincode example simple Chaincode implementation
type SignChaincode struct {
}

// args[0]	number		票号
func (t *SignChaincode) Init(stub shim.ChaincodeStubInterface, function string, args []string) ([]byte, error) {
	fmt.Printf("[Cash][Sign]Start Init:function:%s, args:%#v\n", function, args)
	fmt.Printf("[Cash][Sign]End   Init:function:%s, args:%#v\n", function, args)
	return nil, nil
}

// args[0]	number		票号
// args[1]	stepName	票号名称
// args[2] approved 	批准 "0": rejected, "1":approved

//01 custodianPublish 	(票据托管)
//02 custodianAccept	(接受托管)
//03 onsaleApplication 	(卖方提出申请)
//04 salerPartyReview 	(卖方复核)
//05 salerPartyApproval(卖方审批)
//06 buyinPartyCheck 	(买方审核)
//07 buyinPartyApproval(买方审批)
//08 settlement 	(清算处理，所有权变更)
func (t *SignChaincode) Invoke(stub shim.ChaincodeStubInterface, function string, args []string) ([]byte, error) {
	var err error
	fmt.Printf("[Cash][Sign]Start Invoke:function:%s, args:%#v\n", function, args)
	if function == "initStatus" || function == "updateStatus"{
		if len(args) != 3 {
			return nil, errors.New("sign Invoke Expecting 3 number of arguments.")
		}

		number := args[0]
		step := args[1]
		//approved := args[2]

		err = stub.PutState(number, []byte(step))
		if err != nil {
			fmt.Printf("[Cash]write ledger failed: key=%s,value=%s\n", number, step)
			fmt.Println(err)
			return nil, err
		}
		fmt.Printf("[Cash][Sign]End   Invoke:function:%s\n", function)
		return nil, nil
	}
	fmt.Printf("[Cash][Sign]End   Invoke:function:%s\n", function)
	return nil, nil

}

// args[0]	number		票号
func (t *SignChaincode) Query(stub shim.ChaincodeStubInterface, function string, args []string) ([]byte, error) {
	fmt.Printf("[Cash][Sign]Start Query:function:%s, args:%#v\n", function, args)

	if function == "queryStatus" {
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
	}
	fmt.Printf("[Cash][Sign]End   Query:function:%s\n", function)
	jsonResp := "{\"Error\":\"Unknown function:" + function + "\"}"
	return []byte(jsonResp), nil
}

func main() {
	err := shim.Start(new(SignChaincode))
	if err != nil {
		fmt.Printf("Error starting sign chaincode: %s", err)
	}
}
