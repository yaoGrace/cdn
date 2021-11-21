/*
功       能 : 表单元素验证
返       回 : 检查到错误返回false否则返回true，利用hcFormCheckErrorMsg全局变量保存错误信息，hcFormCheckErrorObj保存错误对象。
-------------------------------------------------------------
支持检查类型     : 描述
string        : 字符串长度验证 参数格式 checkData="x," 或 checkData="x,x"
int           : 整数及整数位数验证 参数格式 checkData="x," 或 checkData="x,x"
between       : 2数之间验证(不限制数值类型) 参数格式 checkData="x,"  checkData=",x" 或 checkData="x,x"
betweenD      : 2数之间验证(数值类型为整数) 参数格式 checkData="x," checkData=",x" 或 checkData="x,x"
betweenF      : 2数之间验证(数值类型为小数) 参数格式 checkData="x," checkData=",x" checkData="x,x"
same          : 是否为某个固定值 参数格式 checkData="xx"
sameWith      : 是否和指定id表单元素的值相等 参数格式 checkData="元素id"
notSame       : 不等某个固定值 参数格式 checkData="xx"
notSameWith   : 是否和指定id表单元素的值不相等 参数格式 checkData="元素id"
email         : 电子邮箱验证 (无需参数)
phone         : 手机号码验证(无需参数)
url           : 验证字符串是否为网址(无需参数)
zipCode       : 国内邮编(无需参数)
reg           : 正则表达式验证 参数格式 checkData="正则表达式内容"
fun           : 通过调用自定义函数进行验证 自动传递值到改函数。例: func(val); 自定义函数的返回值必须为布尔类型(验证成功返回真，否则返回假)。
*/
// 是否开启调试
var graceDeBug          = true;
var hcFormCheckErrorMsg = '';
var hcFormCheckErrorObj = null;

jQuery.fn.extend({
    hcFormCheck : function(){

        var hcCheckStatus = true;
        $(this).find('input,select,textarea').each(function(){
            var checkRes = hcFormCheckBase($(this), true);
            if(!checkRes){hcCheckStatus = false; return false;}
        });
        if(hcCheckStatus){
            if(typeof(hcAttachFormCheck) != 'undefined'){
                hcCheckStatus = hcAttachFormCheck();
            }
        }
        return hcCheckStatus;
    },
    hcFormAutoCheck : function(){
        $(this).find('input,select,textarea').each(function(){
            $(this).change(function(){
                var res = hcFormCheckBase($(this), false);
                if(res){
                    hcFormAutoCheckRight($(this));
                }else{
                    hcFormAutoCheckError($(this));
                }
            });
        });
    },
    sendPhoneMsg : function(btnName, phoneNoId, phonePrefixId, vcodeId, url, vcodeIndex){
        $(this).html(btnName);
        $(this).click(function(){
            var btn = $(this);
            if(btn.html() != btnName){return false;}
            // 检查手机号
            var phoneNo      = $('#'+phoneNoId).val();
            var reg          = /^1[0-9]{10}$/;
            if(!reg.test(phoneNo)){return loginStatusShow(false, '手机号码错误');}
            // 检查验证码
            var vcode        = $('#'+vcodeId).val();
            if(vcode.length < 4){return loginStatusShow(false, '请正确填写图片验证码');}
            var phonePrefix  = $('#'+phonePrefixId+' input').eq(0).val();
            phoneNo          = phonePrefix+phoneNo;
            btn.html('发送中 ...');
            $.get(url + '/'+vcode+'/'+phoneNo, function(res){
                if(graceDeBug){console.log(res);}
                if(typeof (res) == "string"){
                    res = JSON.parse(res);
                } 
                if(res.status){
                    loginStatusShow(true, '验证短信发送成功');
                    // 倒计时
                    var countdownTime = 60;
                    var intervalId    = setInterval(function(){
                        if(countdownTime < 1){
                            btn.html(btnName);
                            clearInterval(intervalId);
                            return false;
                        }
                        countdownTime --;
                        btn.html(countdownTime + " 秒后重新发送");
                    }, 1000);
                }else{
                    loginStatusShow(false, res.data);
                    changeVcode('vcode', vcodeIndex);
                    btn.html(btnName);
                }
            });
        });
    },
    slideMenu : function(menuId){
        var _self = $(this);
        var sets  = _self.offset();
        var menu  = $(menuId);
        var timerSlideMenu = null;
        menu.css({left:sets.left+'px', width:_self.outerWidth()+'px'});
        _self.hover(function(){
            sets  = $(this).offset();
            menu.css({left:sets.left+'px', width:_self.outerWidth()+'px'});
            $('.gui-slide-menu').hide();
            menu.slideDown(150);
        }, function(){timerSlideMenu = setTimeout(function(){menu.slideUp(150);}, 500);});
        menu.hover(function(){clearTimeout(timerSlideMenu);}, function(){
            menu.slideUp(150);
        });
    },
    guiAccordion : function(currentIndex){
        $('.gui-accordion dt').click(function (){
            currentIndex = $(this).parent().index();
            guiAccordionBase(currentIndex);
        });
        guiAccordionBase(currentIndex);
    }
});

function guiAccordionBase(index){
    var accordion = $('#gui-accordion');
    var oStatus   = accordion.find('dl').eq(index).find('dd').eq(0).is(':hidden');
    accordion.find('dd').hide();
    accordion.find('dt').removeClass('gui-dt-current');
    accordion.find('dt').find('div').removeClass('icon-jiantou-up');
    if(oStatus) {
        accordion.find('dt').eq(index).find('div').addClass('icon-jiantou-up');
        accordion.find('dl').eq(index).find('dd').show();
        accordion.find('dl').eq(index).find('dt').addClass('gui-dt-current');
    }
}

function hcFormCheckBase(cObj, isMsg){
    var checkType  = cObj.attr('checkType');
    if(typeof(checkType) == 'undefined'){return true;}
    checkType      = checkType.toLowerCase();
    var checkData  = cObj.attr('checkData');
    checkMsg       = cObj.attr('checkMsg');
    if(typeof(checkMsg) == 'undefined'){return true;}
    var checkVal   = cObj.val();
    switch(checkType){
        case 'string' :
            var checkArr  = checkData.split(',');
            if(checkVal.length < checkArr[0]){
                return hcFormCheckReError(cObj, checkMsg, isMsg);
            }
            if(checkArr[1] != ''){
                if(checkVal.length > checkArr[1]){
                    return hcFormCheckReError(cObj, checkMsg, isMsg);
                }
            }
            break;
        case 'int' :
            var reg  = new RegExp('^\-?[0-9]{'+checkData+'}$');
            if(!reg.test(checkVal)){return hcFormCheckReError(cObj, checkMsg, isMsg);}
            var reg2 = new RegExp('^\-?0+[0-9]+$');
            if(reg2.test(checkVal)){return hcFormCheckReError(cObj, checkMsg, isMsg);}
            break;
        case 'between' :
            if(!hcFormCheckNumber(checkVal, checkData, cObj, checkMsg, isMsg)){return false;}
            break;
        case 'betweend' :
            var reg  = new RegExp('^\-?[0-9]+$');
            if(!reg.test(checkVal)){return hcFormCheckReError(cObj, checkMsg, isMsg);}
            if(!hcFormCheckNumber(checkVal, checkData, cObj, checkMsg, isMsg)){return false;}
            break;
        case 'betweenf' :
            var reg  = new RegExp('^\-?[0-9]+\.[0-9]+$');
            if(!reg.test(checkVal)){return hcFormCheckReError(cObj, checkMsg, isMsg);}
            if(!hcFormCheckNumber(checkVal, checkData, cObj, checkMsg, isMsg)){return false;}
            break;
        case 'same' :
            if(checkVal != checkData){return hcFormCheckReError(cObj, checkMsg, isMsg);}
            break;
        case 'samewith' :
            if(checkVal != $('#'+checkData).val()){return hcFormCheckReError(cObj, checkMsg, isMsg);}
            break;
        case 'notsame' :
            if(checkVal == checkData){return hcFormCheckReError(cObj, checkMsg, isMsg);}
            break;
        case 'notsamewith' :
            if(checkVal == $('#'+checkData).val()){return hcFormCheckReError(cObj, checkMsg, isMsg);}
            break;
        case 'email' :
            var reg = /^\w+([-+.']\w+)*@\w+([-.]\w+)*\.\w+([-.]\w+)*$/;
            if(!reg.test(checkVal)){return hcFormCheckReError(cObj, checkMsg, isMsg);}
            break;
        case 'phone' :
            var reg = /^13[0-9]{9}$|14[0-9]{9}|15[0-9]{9}$|18[0-9]{9}$/;
            if(!reg.test(checkVal)){return hcFormCheckReError(cObj, checkMsg, isMsg);}
            break;
        case 'url'  :
            var reg = /^(\w+:\/\/)?\w+(\.\w+)+.*$/;
            if(!reg.test(checkVal)){return hcFormCheckReError(cObj, checkMsg, isMsg);}
            break;
        case 'zipcode'  :
            var reg = /^[0-9]{6}$/;
            if(!reg.test(checkVal)){return hcFormCheckReError(cObj, checkMsg, isMsg);}
            break;
        case 'reg'  :
            var reg = new RegExp(checkData);
            if(!reg.test(checkVal)){return hcFormCheckReError(cObj, checkMsg, isMsg);}
            break;
        case 'fun'  :
            eval('var res = '+checkData+'("'+checkVal+'");');
            if(!res){return hcFormCheckReError(cObj, checkMsg, isMsg);}
            break;
    }
    return true;
}

function hcFormCheckNumber(checkVal, checkData, cObj, checkMsg, isMsg){
    checkVal = Number(checkVal);
    if(isNaN(checkVal)){return hcFormCheckReError(cObj, checkMsg, isMsg);}
    cObj.val(checkVal);
    checkDataArray = checkData.split(',');
    if(checkDataArray[0] == ''){
        if(checkVal > Number(checkDataArray[1])){return hcFormCheckReError(cObj, checkMsg, isMsg);}
    }else if(checkDataArray[1] == ''){
        if(checkVal < Number(checkDataArray[0])){return hcFormCheckReError(cObj, checkMsg, isMsg);}
    }else{
        if(checkVal < Number(checkDataArray[0]) || checkVal > Number(checkDataArray[1])){
            return hcFormCheckReError(cObj, checkMsg, isMsg);
        }
    }
    return true;
}

function hcFormCheckReError(cObj, checkMsg, isMsg){
    hcFormCheckErrorObj = cObj;
    hcFormCheckErrorMsg = checkMsg;
    if(isMsg){
        if(typeof(hcFormCheckErrorShow) == 'undefined'){
            graceToast(hcFormCheckErrorMsg);
        }else{
            hcFormCheckErrorShow(hcFormCheckErrorMsg);
        }
    }
    return false;
}

function gracePost(url, data, callback, formId, submitBtnId, successBtnHtml){
    var btnText = $('#'+submitBtnId).html();
    // 阻止重复提交
    if($('#'+submitBtnId).html() != btnText){return false;}
    // 表单检查
    if(formId){var res = $('#'+formId).hcFormCheck(); if(!res){return false;}}
    if(!successBtnHtml){successBtnHtml = '提交成功';}
    $('#'+submitBtnId).html('<i class="layui-icon layui-icon-loading layui-anim layui-anim-rotate layui-anim-loop gui-color-white"></i> 提交中');
    $.ajax({
        url       : url,
        type      : 'POST',
        async     : true,
        data      : data,
        timeout   : 10000,
        success:function(res){
            if(graceDeBug){console.log(res);}
            if(typeof (res) == "string"){
                res = JSON.parse(res);
            }
            if(res.status == 'ok' || res.status){
                $('#'+submitBtnId).html(successBtnHtml);
            }else{
                $('#'+submitBtnId).html(btnText);
            }
            callback(res);
        },
        error : function(xhr,textStatus){
            graceToast('服务器忙，请重试');
            $('#'+submitBtnId).html(btnText);
        }
    });
}

function changeVcode(inputClass, index){
    $('.'+inputClass).eq(index).val('');
    $('.gui-vcode').eq(index).html('<img src="/index/vcode/?bg=246-246-246&r='+ Math.random() +'" />');
}

/* 轮播组件 */
function graceSwipe(selector){
    this.swipe       = $(selector);
    this.swipeIn     = this.swipe.find('.gui-swiper-items')
    this.items       = this.swipe.find('.gui-swiper-item');
    this.itemSize    = this.items.length;
    this.realSize    = this.items.length + 2;
    this.scale       = 1 / this.realSize;
    this.swipeIn.css({width: this.realSize * 100 +'%'});
    this.items.css({width: this.scale * 100 +'%'});
    this.width       = this.swipe.width();
    this.index       = 1;
    this.speed       = 1000;
    this.delay       = 5000;
    this.timer       = null;
    this.indicatorOn = true;
    this.autoPlay    = true;
    var _self = this;
    var lastItem     = this.items.last();
    this.items.eq(0).clone().appendTo(this.swipeIn);
    lastItem.clone().prependTo(this.swipeIn);
    this.items       = this.swipe.find('.gui-swiper-item');
    this.swipeIn.css({transform:'translate3d(' + this.scale * -100 +'%, 0px, 0px)'});
    /* 进度标示 */
    this.indicator  = this.swipe.find('.gui-swiper-indicator');
    if(this.indicator.length < 1){
        var indicatorDom = document.createElement('div');
        indicatorDom.setAttribute('class', 'gui-swiper-indicator');
        var html = '<div style="display:flex; flex-direction:row; justify-content:center;">';
        for(var i = 0; i < this.itemSize; i++){html += '<div class="gui-swiper-indicators"></div>';}
        indicatorDom.innerHTML = html + '</div>';
        $(indicatorDom).appendTo(this.swipe);
    }
    this.indicator  = this.swipe.find('.gui-swiper-indicator');
    this.indicator.find('.gui-swiper-indicators').eq(0).addClass('gui-swiper-indicator-active');
    this.items.show();
    this.changeIndicator = function(index){
        _self.indicator.find('.gui-swiper-indicators').removeClass('gui-swiper-indicator-active');
        _self.indicator.find('.gui-swiper-indicators').eq(index - 1).addClass('gui-swiper-indicator-active');
    };
    this.change = function(){
        if(_self.timer){clearTimeout(_self.timer);}
        _self.swipeIn.get(0).style.transform  = 'translate3d('+ (_self.scale * _self.index * -100) +'%, 0px, 0px)';
        _self.swipeIn.get(0).style.transition = 'linear 300ms';
        setTimeout(function(){_self.swipeIn.get(0).style.transition = 'none';}, 300);
        if(_self.index < 1){
            _self.index = this.itemSize;
            setTimeout(function(){
                _self.swipeIn.get(0).style.transform  = 'translate3d('+ (_self.scale * _self.index * -100) +'%, 0px, 0px)';
                _self.swipeIn.get(0).style.transition = 'none';
            }, 200);
            _self.changeIndicator(_self.index);
        }else if(_self.index > _self.itemSize){
            _self.index = 1;
            setTimeout(function(){
                _self.swipeIn.get(0).style.transform  = 'translate3d('+ (_self.scale * _self.index * -100) +'%, 0px, 0px)';
                _self.swipeIn.get(0).style.transition = 'none';
            }, 200);
            _self.changeIndicator(_self.index);
        }else{
            _self.changeIndicator(_self.index);
        }
        if(_self.autoPlay){_self.timer = setTimeout(function(){_self.index++; _self.change();}, _self.delay);}
    };
    this.run = function(){
        if(this.autoPlay){this.change();}
        if(this.indicatorOn){this.indicator.show();}
    }
}

function graceToast(msg, duration){
    duration=isNaN(duration) ? 2000 : duration;
    var m = document.createElement('div');
    m.innerHTML = '<div style="width:188px; color:#fff;  line-height:40px; background:#000; opacity:0.6; margin:0 auto; text-align:center; border-radius:5px;">'+msg+'</div>';
    m.style.cssText="width:100%; height:40px; position:fixed; top:50%; z-index:999999;";
    document.body.appendChild(m);
    setTimeout(function(){
        var d = 0.5;
        m.style.webkitTransition = '-webkit-transform ' + d + 's ease-in, opacity ' + d + 's ease-in';
        m.style.opacity = '0';
        setTimeout(function() {document.body.removeChild(m) }, d * 1000);
    }, duration);
    return false;
}

/* 选项卡 */
function graceTab(selector, callBack){
    var _self       = this;
    this.tab        = $(selector);
    this.tabTitles  = this.tab.find('li');
    this.changIndex = function(index){
        this.tabTitles.removeClass('gui-tab-current');
        this.tabTitles.eq(index).addClass('gui-tab-current');
        this.tab.find('.gui-tab-content').hide();
        this.tab.find('.gui-tab-content').eq(index).fadeIn(200);
        if(callBack){callBack(index);}
    };
    this.tabTitles.click(function(){
        _self.changIndex($(this).index());
    });
}

/* 获取表单数据并转换为对象 */
function getFormData(formId){
    var dataReturn = {};
    $.each($(formId).serializeArray(), function() {
        dataReturn[this.name] = this.value;
    });
    return dataReturn;
}

// 时间戳转 YY-mm-dd HH:ii:ss
function toDate(timeStamp, returnType){
    timeStamp = parseInt(timeStamp);
    var date = new Date();
    if(timeStamp < 90000000000 ){
        date.setTime(timeStamp * 1000);
    }else{
        date.setTime(timeStamp );
    }
    var y = date.getFullYear();
    var m = date.getMonth() + 1;
    m = m < 10 ? ('0' + m) : m;
    var d = date.getDate();
    d = d < 10 ? ('0' + d) : d;
    var h = date.getHours();
    h = h < 10 ? ('0' + h) : h;
    var minute = date.getMinutes();
    var second = date.getSeconds();
    minute = minute < 10 ? ('0' + minute) : minute;
    second = second < 10 ? ('0' + second) : second;
    if(returnType == 'str'){return y + '-' + m + '-' + d + ' '+ h +':' + minute + ':' + second;}
    return [y, m, d, h, minute, second];
}
// 字符串转时间戳
function toTimeStamp(timeStamp){
    var reg = /^([0-9]{4})-([0-9]{2})-([0-9]{2}) ([0-9]{2}):([0-9]{2}):([0-9]{2})$/;
    var res = timeStamp.match(reg);
    if (res == null){
        var reg2 = /^([0-9]{2})\/([0-9]{2})\/([0-9]{4}) ([0-9]{2}):([0-9]{2}):([0-9]{2})$/;
        var res2 = timeStamp.match(reg2);
        if(res2 == null){ console.log('时间格式错误 E001'); return false;}
        var year  = parseInt(res2[3]);
        var month = parseInt(res2[1]);
        var day   = parseInt(res2[2]);
        var h     = parseInt(res2[4]);
        var i     = parseInt(res2[5]);
        var s     = parseInt(res2[6]);
    }else{
        var year  = parseInt(res[1]);
        var month = parseInt(res[2]);
        var day   = parseInt(res[3]);
        var h     = parseInt(res[4]);
        var i     = parseInt(res[5]);
        var s     = parseInt(res[6]);
    }
    if (year < 1000) { console.log('时间格式错误'); return false; }
    if (h < 0 || h > 24) { console.log('时间格式错误'); return false; }
    if (i < 0 || i > 60) { console.log('时间格式错误'); return false; }
    if (s < 0 || s > 60) { console.log('时间格式错误'); return false; }
    return Date.parse(new Date(year, month - 1, day, h, i, s));
}
// 根据时间戳计算多少分钟/小时/天之前
function fromTime(time){
    if(time < 90000000000 ){time *= 1000;}
    var timer = new Date().getTime() - time;
    timer = parseInt(timer / 1000);
    if(timer < 180){
        return '刚刚';
    }else if(timer >= 180 && timer < 3600){
        return parseInt(timer / 60) + '分钟前';
    }else if(timer >= 3600 && timer < 86400){
        return parseInt(timer / 3600) + '小时前';
    }else if(timer >= 86400 && timer < 2592000){
        return parseInt(timer / 86400) + '天前';
    }else{
        return toDate(time, 'str');
    }
}

/* 手机号前缀 */
function initPhonePrefix(){
    $(function () {
        $('.gui-phone-pre-label').click(function () {
            var mainDom = $(this).parent();
            var menu    = mainDom.find('.gui-phone-pre');
            if(menu.is(':hidden')){
                menu.slideDown(200);
            }else{
                menu.slideUp(200);
            }
        });
        $('.gui-phone-pre-item').click(function () {
            var mainDom = $(this).parent().parent();
            var val     = $(this).find('input').val();
            mainDom.find('.gui-phone-pre-label').find('span').eq(0).html(val);
            mainDom.find('.gui-phone-pre-label input').eq(0).val(val);
            mainDom.find('.gui-phone-pre').slideUp(200);
        });
    });
}

/* 收藏 */
function isCollect(id, type, isLogin){
    if(isLogin == -1){return ;}
    var guiCollectText = $('#gui-collect-text');
    $.getJSON(
        '/collect/isCollected/'+id+'/'+type,{},
        function (res) {
            if(res.status){
                if(res.data == 'ok'){
                    guiCollectText.html('已经收藏');
                    $('#gui-collect-warp').addClass('gui-collected');
                }else{
                    guiCollectText.html('收藏此文');
                    $('#gui-collect-warp').removeClass('gui-collected');
                }
            }else{
                guiCollectText.html('收藏此文');
            }
        }
    );
}
function collect(id, type, isLogin){
    if(isLogin == -1){
        graceToast('请先登录 ~');
        setTimeout(()=>{
            location.href = '/login';
        }, 1500);
        return false;
    }
    var guiCollectText = $('#gui-collect-text');
    if(guiCollectText.html() == '请稍候...'){return ;}
    guiCollectText.html('请稍候...');
    $.getJSON(
        '/collect/add/'+id+'/'+type,{},
        function (res) {
            if(res.status){
                if(res.data == 'ok'){
                    guiCollectText.html('已经收藏');
                    $('#gui-collect-warp').addClass('gui-collected');
                }else{
                    guiCollectText.html('收藏此文');
                    $('#gui-collect-warp').removeClass('gui-collected');
                }
            }else{
                guiCollectText.html('收藏此文');
            }
        }
    );
}
// 删除评论
function removeComments(commentsId){
    $.get('/account/removecomments/'+commentsId, {}, function(res){
        setTimeout(function(){
            $('#gui-top-'+commentsId).remove();
        }, 300);
    });
}
// 删除话题
function removeTopic(id){
    if(confirm("确定要删除话题吗?")){
        $.getJSON('/account/removeTopic/'+id, {}, function(res){
            if(res.status){
                graceToast('删除成功');
                setTimeout(function(){
                    $('#topiclist_'+id).remove();
                }, 300);
            }else {
                graceToast(res.data);
            }
        });
    }
}