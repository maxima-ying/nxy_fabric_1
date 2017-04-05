$(function() {
    //Menu: 任务中心
    $("#link-tasks").click(function() {
        var token = $('body').attr('data-token');
        var option = {
            type:"GET",
            url:"/api/task/list",
            dataType:"json",
            data:{},
            beforeSend: function(xhr){
                xhr.setRequestHeader('token', token);
            },
            success:function(res){
                if (res.token) {
                    $("body").attr("data-token", res.token);
                    $("#div_page_content").html(tmpl("tmpl-tasks", {tasks: res.tasks}));

                    datatablesRowClicked("table-tasks", function(tr) {
                        var bill_no = $(tr).find("td[name='bill_no']").html();
                        console.log("selected: " + bill_no);
                        loadTask(bill_no);
                    });

                    $("#table-tasks").find("button[class~='btn-success']").click(function() {
                        var tr = $(this.parentNode.parentNode);
                        if (this.getAttribute('data-next') == '03') {
                            var bill_no = $(tr).find("td[name='bill_no']").html();
                            loadTask(bill_no);
                        } else {
                            invokeSign(tr.attr('data-bill_no'), tr.attr('data-current_step'), 1);
                        }
                    });
                    $("#table-tasks").find("button[class~='btn-primary']").click(function() {
                        //alert('rejected:');
                        var tr = $(this.parentNode.parentNode);
                        invokeSign(tr.attr('data-bill_no'), tr.attr('data-current_step'), 0);
                    });
                } else {
                    new PNotify({
                        styling: 'bootstrap3',
                        title: 'Load Task Failed',
                        text: 'Please try again.',
                        type: 'error',
                        icon: true,
                        animate_speed: 'normal',
                        delay: 2000
                    });
                }
            },
            error:function(err){
                new PNotify({
                    styling: 'bootstrap3',
                    title: 'System Error',
                    text: err,
                    type: 'error',
                    icon: true,
                    animate_speed: 'normal',
                    delay: 2000
                });
            }
        };
        $.ajax(option);
    });

    function loadTask(id) {
        var token = $('body').attr('data-token');
        var option = {
            type:"GET",
            url:"/api/task",
            dataType:"json",
            data:{id: id},
            beforeSend: function(xhr){
                xhr.setRequestHeader('token', token);
            },
            success:function(res){
                if (res.token) {
                    $("body").attr("data-token", res.token);
                    console.log("loaded task: " + JSON.stringify(res.task));
                    showBillDetail(res.task, res.lang);
                } else {
                    new PNotify({
                        styling: 'bootstrap3',
                        title: 'Load Task Failed',
                        text: 'Please try again.',
                        type: 'error',
                        icon: true,
                        animate_speed: 'normal',
                        delay: 2000
                    });
                }
            },
            error:function(err){
                new PNotify({
                    styling: 'bootstrap3',
                    title: 'System Error',
                    text: err,
                    type: 'error',
                    icon: true,
                    animate_speed: 'normal',
                    delay: 2000
                });
            }
        };
        $.ajax(option);
    }

    //trigger first menu
    $SIDEBAR_MENU.find('a:first').trigger('click');

    //Menu: 资产中心
    $("#link-assets").click(function() {
        var body = $('body');
        var token = body.attr('data-token');
        var option = {
            type:"GET",
            url:"/api/account",
            dataType:"json",
            data:{party: body.attr('data-party')},
            beforeSend: function(xhr){
                xhr.setRequestHeader('token', token);
            },
            success:function(res){
                if (res.result) {
                    $("body").attr("data-token", res.token);
                    $("#div_page_content").html(tmpl("tmpl-asset", {account: res.account}));
                } else {
                    new PNotify({
                        styling: 'bootstrap3',
                        title: 'Load Asset Failed',
                        text: 'Please try again.',
                        type: 'error',
                        icon: true,
                        animate_speed: 'normal',
                        delay: 2000
                    });
                }
            },
            error:function(err){
                new PNotify({
                    styling: 'bootstrap3',
                    title: 'System Error',
                    text: err,
                    type: 'error',
                    icon: true,
                    animate_speed: 'normal',
                    delay: 2000
                });
            }
        };
        $.ajax(option);
    });

    //Menu: 票据托管
    $("#link-bill_input").click(function() {
        setupInitPage();
    });

    //trigger first menu
    $SIDEBAR_MENU.find('a:first').trigger('click');
});
