//任务详细显示/隐藏开关
function toggleTaskDetail() {
    var taskDetail = $('#div-task_detail');
    var toggle = $('#toggle-task_detail');
    var label = $('#div_label_detail').val();
    taskDetail.toggle();

    if (taskDetail.css("display") == "none") {
        toggle.html(label + "  <i class='fa fa-angle-double-down'></i>");
    } else {
        toggle.html(label + "  <i class='fa fa-angle-double-up'></i>");
    }
}

//任务审批/任务驳回
function invokeSign(bill_no, step, next, params) {
    //begin waiting...
    beginWaiting();
    var data = {
        bill_no: bill_no,
        step: step,
        next: next};
    if (params) {
        data['party1'] = params.party1;
        data['party2'] = params.party2;
        data['amount'] = params.amount;
    }
    var options = {
        type:"POST",
        url:"/api/sign/invoke",
        dataType:"json",
        data: data,
        beforeSend: function(xhr){
            xhr.setRequestHeader('token', $('body').attr('data-token'));
        },
        success:function(res){
            if (res.result) {
                new PNotify({
                    styling: 'bootstrap3',
                    //title: '执行成功',
                    title: '操作完了',
                    text: '',
                    type: 'success',
                    icon: true,
                    animate_speed: 'normal',
                    delay: 2000
                });
                $("body").attr("data-token", res.token);

                $("#link-tasks").trigger('click');
            } else {
                new PNotify({
                    styling: 'bootstrap3',
                    //title: '执行失败',
                    title: '操作結果異常',
                    text: JSON.stringify(res.err),//'票据托管失败, 请重试或联系管理员.',
                    type: 'error',
                    icon: true,
                    animate_speed: 'normal',
                    delay: 2000
                });
            }
            //stop waiting...
            endWaiting();
        },
        error:function(err){
            new PNotify({
                styling: 'bootstrap3',
                //title: '系统错误',
                title: 'システムエラー',
                text: err.responseText,
                type: 'error',
                icon: true,
                animate_speed: 'normal',
                delay: 2000
            });
            //stop waiting...
            endWaiting();
        }
    };
    $.ajax(options);
}

//票据详细Dialog
function showBillDetail(data, lang) {
    var bill_info_detail = lang.bill_info_detail;
    var formHTML = tmpl("tmpl-bill_detail", data);
    var option = {
        title: bill_info_detail  + " - " + data.current_step.name,
        message: formHTML,
        buttons: {
        }
    };

    if (data.current_step.actions) {
        if (data.current_step.actions.next) {
            option.buttons['Yes'] = {
                label: data.current_step.actions.next.action,
                className: "btn-success",
                callback: function () {
                    if ($('form').parsley().validate() == false) {
                        return false;
                    }
                    var params = {};
                    if (data.current_step.actions.next.id == '03') {
                        var party1 = $("#text-saler_party").val();
                        var party2 = $("#text-buyin_party").val();
                        var amount = $("#text-deal_amount").val();
                        params = {party1: party1, party2: party2, amount: amount};
                    }
                    invokeSign(data.bill_no, data.current_step.id, 1, params);
                }
            };
        }
        if (data.current_step.actions.back) {
            option.buttons['No'] = {
                label: data.current_step.actions.back.action,
                className: "btn-primary",
                callback: function () {
                    invokeSign(data.bill_no, data.current_step.id, 0);
                }
            };
        }
    }

    option.buttons['Cancel'] = {
        label: lang.close,
        className: "btn-danger",
        callback: function () {
            //alert('关闭');
        }
    };

    bootbox.dialog(option);
    setupiCheck();
}

function beginWaiting() {
    $('#div-waiting').show();
}

function endWaiting() {
    $('#div-waiting').hide();
}

//票据录入
function initBill() {
    //begin waiting...
    beginWaiting();
    var bill_data = {
        "bill_attr": $('input:radio[name="radio-bill_attr"]:checked').val(),
        "bill_type": $('input:radio[name="radio-bill_type"]:checked').val(),
        "issuer_name": $('#text-issuer_name').val(),
        "issuer_account": $('#text-issuer_account').val(),
        "issuer_bank": $('#text-issuer_bank').val(),
        "custodian_name": $('#text-custodian_name').val(),
        "custodian_account": $('#text-custodian_account').val(),
        "custodian_bank": $('#text-custodian_bank').val(),
        "acceptor_name": $('#text-acceptor_name').val(),
        "acceptor_account": $('#text-acceptor_account').val(),
        "acceptor_bank": $('#text-acceptor_bank').val(),
        "face_amount": $('#text-face_amount').val(),
        "issue_date": $('#text-issue_date').val(),
        "due_date": $('#text-due_date').val(),
        "accept_date": $('#text-accept_date').val(),
        "pay_bank": $('#text-pay_bank').val(),
        "trans_enable": $('input:radio[name="radio-trans_enable"]:checked').val()
    };
    var options = {
        type:"POST",
        url:"/api/sign/init",
        dataType:"json",
        data: bill_data,
        beforeSend: function(xhr){
            xhr.setRequestHeader('token', $('body').attr('data-token'));
        },
        success:function(res){
            if (res.result) {
                new PNotify({
                    styling: 'bootstrap3',
                    //title: '保存成功',
                    title: '保存完了',
                    text: '',
                    type: 'success',
                    icon: true,
                    animate_speed: 'normal',
                    delay: 2000
                });
                $("body").attr("data-token", res.token);

                setupInitPage();
            } else {
                new PNotify({
                    styling: 'bootstrap3',
                    //title: '失败',
                    title: '異常',
                    text: JSON.stringify(res.err),//'票据托管失败, 请重试或联系管理员.',
                    type: 'error',
                    icon: true,
                    animate_speed: 'normal',
                    delay: 2000
                });
            }
            //stop waiting...
            endWaiting();
        },
        error:function(err){
            new PNotify({
                styling: 'bootstrap3',
                //title: '系统错误',
                title: 'システムエラー',
                text: err.responseText,
                type: 'error',
                icon: true,
                animate_speed: 'normal',
                delay: 2000
            });
            //stop waiting...
            endWaiting();
        }
    };
    $.ajax(options);
}


//票据缺省信息指定
function setupInitPage() {
    //reset page data
    var default_input = {
        "bill_attr": 0,
        "bill_type": 0,
        "issuer_name": "Org A",
        "issuer_account": "12345678",
        "issuer_bank": "Bank A",
        "custodian_name": "Org B",
        "custodian_account": "23456789",
        "custodian_bank": "Bank B",
        "acceptor_name": "Org C",
        "acceptor_account": "34567890",
        "acceptor_bank": "Bank C",
        "face_amount": "1000000",
        "issue_date": "2016/05/30",
        "due_date": "2017/05/30",
        "accept_date": "2016/12/31",
        "pay_bank": "Bank D",
        "trans_enable": 0
    };
    $("#div_page_content").html(tmpl("tmpl-bill_init", default_input));
    var validator = $('form').parsley();
    $("#div_page_content").find("button[class~='btn-success']").click(function() {
        if (validator.validate() != true) {
            return;
        }
        initBill();
    });

    $('.input-group.date').datepicker({
        //language: 'zh-CN',
        language: 'ja',
        format: "yyyy/mm/dd",
        autoclose: true
    });
    setupPanelToolBox();
    setupiCheck();
}


