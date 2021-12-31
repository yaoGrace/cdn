<?php
/**
 * @文件功能名称  : 支付宝当面付类
 * @Author      : yaoGrace
 * @Date        : 2021/12/31 20:31
 */
namespace phpGrace\tools;
class alipayDmf{
    protected $appId;       #应用appid
    protected $notifyUrl;   #通知url
    protected $charset;     #字符编码
    //私钥值
    protected $rsaPrivateKey;   #商家私钥
    protected $totalFee;        #订单金额
    protected $outTradeNo;      #商户自定义生成的订单号
    protected $orderName;       #订单标题 / 商品标题
    protected $timeout_express = '2h'; // 默认过期时间2小时
    protected $tradeNo;         # 支付宝生成的订单号
    // 构造函数 设置默认初始编码为utf-8编码
    public function __construct()
    {
        $this->charset = 'utf-8';
    }
    // 设置appid
    public function setAppid($appid)
    {
        $this->appId = $appid;
    }
    // 设置通知网址（服务器通知）
    public function setNotifyUrl($notifyUrl)
    {
        $this->notifyUrl = $notifyUrl;
    }
    // 设置商户私钥
    public function setRsaPrivateKey($saPrivateKey)
    {
        $this->rsaPrivateKey = $saPrivateKey;
    }
    // 设置订单金额
    public function setTotalFee($payAmount)
    {
        $this->totalFee = $payAmount;
    }
    // 设置商户订单号，商户自定义
    public function setOutTradeNo($outTradeNo)
    {
        $this->outTradeNo = $outTradeNo;
    }
    // 订单名称
    public function setOrderName($orderName)
    {
        $this->orderName = $orderName;
    }
    // 设置交易超过时间
    public function setTimeoutExpress($timeout_express){
        $this->timeout_express = $timeout_express;
    }
    // 设置 支付宝交易号
    public function setTradeNo($tradeNo)
    {
        $this->tradeNo = $tradeNo;
    }
    /**
     *  功能：发起生成订单
     *  -------------------------------------------------------------------------------------------------------------------------
     *  扫码支付集成代码  开发文档 https://opensupport.alipay.com/support/helpcenter/99/201602490909?ant_source=opendoc_recommend
     *  扫码支付集成代码详见alipay.trade.precreate示例。
     *  参数名称            是否必传    参数说明
     *  out_trade_no        是        商户订单号，商户自定义，需要保证不重复
     *  subject             是        订单标题
     *  total_amount        是        订单金额
     *  store_id            否        商户门店编号
     *  timeout_express     否        交易超时时间
     *  product_code        否        销售产品码（当面付）：固定传值FACE_TO_FACE_PAYMENT ，不传默认使用FACE_TO_FACE_PAYMENT
     *  -------------------------------------------------------------------------------------------------------------------------
     * @return array
     */
    public function doPay()
    {
        //请求参数
        $requestConfigs = array(
            'out_trade_no'      =>  $this->outTradeNo,//商户订单
            'total_amount'      =>  $this->totalFee, //订单金额（单位 元）
            'subject'           =>  $this->orderName,  //订单标题
            //该笔订单允许的最晚付款时间，逾期将关闭交易。取值范围：1m～15d。m-分钟，h-小时，d-天，1c-当天（1c-当天的情况下，无论交易何时创建，都在0点关闭）。 该参数数值不接受小数点， 如 1.5h，可转换为 90m。
            'timeout_express'   =>  $this->timeout_express
        );
        $commonConfigs = array(
            //公共参数
            'app_id'            =>  $this->appId,
            'method'            =>  'alipay.trade.precreate',     //接口名称  扫码支付(alipay.trade.precreate):商家生成二维码，用户扫码付款
            'format'            =>  'JSON',
            'charset'           =>  $this->charset,
            'sign_type'         =>  'RSA2',
            'timestamp'         =>  date('Y-m-d H:i:s'),
            'version'           =>  '1.0',
            'notify_url'        =>  $this->notifyUrl,
            'biz_content'       =>  json_encode($requestConfigs),
        );
        $commonConfigs["sign"] = $this->generateSign($commonConfigs, $commonConfigs['sign_type']);
        // 支付宝生成订单等信息的url接口
        $url = 'https://openapi.alipay.com/gateway.do?charset='.$this->charset;
        $result = $this->curlPost($url,$commonConfigs);
        // 解码结果
        $result = json_decode($result,true);
        return  $result['alipay_trade_precreate_response'];
    }

    /**
     * 当面付发起查询订单
     * -----------------------------------------------------------------------------------------------
     * 该接口提供所有支付宝支付订单的查询，商户可以通过该接口主动查询订单状态
     * 文档 https://opendocs.alipay.com/apis/api_1/alipay.trade.query?scene=API002020081000013487
     * 公共参数：
    ------------------------------------------------------------------------------------------------------------------------------------------------------------------
     * 参数                 类型     是否必填    最大长度    描述                                                                                   |   示例值
    ------------------------------------------------------------------------------------------------------------------------------------------------------------------
     * app_id             string      是         32       支付宝分配给开发者的应用ID                                                                | 201xxxxxxxx
    ------------------------------------------------------------------------------------------------------------------------------------------------------------------
     * method             String      是         128      接口名称                                                                                | alipay.trade.query
    ------------------------------------------------------------------------------------------------------------------------------------------------------------------
     * format             String      否         40       仅支持JSON                                                                              | JSON
    ------------------------------------------------------------------------------------------------------------------------------------------------------------------
     * charset            String      是         10       请求使用的编码格式，如utf-8,gbk,gb2312等                                                   | utf-8
    ------------------------------------------------------------------------------------------------------------------------------------------------------------------
     * sign_type          String      是         10       商户生成签名字符串所使用的签名算法类型，目前支持RSA2和RSA，推荐使用RSA2                         | RSA2
    ------------------------------------------------------------------------------------------------------------------------------------------------------------------
     * sign               String      是         344      商户请求参数的签名串，详见签名 https://opendocs.alipay.com/open/291/105974                  | 详见示例
    ------------------------------------------------------------------------------------------------------------------------------------------------------------------
     * timestamp          String      是         19       发送请求的时间，格式"yyyy-MM-dd HH:mm:ss"                                                 | 2021-12-31 03:07:50
    ------------------------------------------------------------------------------------------------------------------------------------------------------------------
     * version            String      是         3        调用的接口版本，固定为：1.0                                                                |  1.0
    ------------------------------------------------------------------------------------------------------------------------------------------------------------------
     * app_auth_token     String      否         40       详见应用授权概述                                                                          |
    ------------------------------------------------------------------------------------------------------------------------------------------------------------------
     * biz_content        String      是                  请求参数的集合，最大长度不限，除公共参数外所有请求参数都必须放在这个参数中传递，具体参照各产品快速接入文档 |
     * ----------------------------------------------------------------------------------------------------------------------------------------------------------------
     *
     *  特殊请求参数：
     *  简单理解 就是查询商户自定义订单的
     *  参数              类型      是否必填    最大长度    描述  示例值
     *  out_trade_no    String     特殊可选      64       订单支付时传入的商户订单号，和支付宝交易号不能同时为空。trade_no，out_trade_no 如果同时存在则优先取 trade_no
     *  trade_no        String     特殊可选      64       支付宝交易号，和商户订单号不能同时为空
     *  query_options   String[]   可选         1024     查询选项，商户通过上送该参数来定制同步需要额外返回的信息字段，数组格式。
     *----------------------------------------------------------------------------------------------------------------------------------------------------------------
     * @return array  返回INPROCESS的状态
     */
    public function doQuery()
    {
        //请求参数
        $requestConfigs = array(
            'out_trade_no'      =>  $this->outTradeNo,
            'trade_no'          =>  $this->tradeNo,
        );
        $commonConfigs = array(
            //公共参数
            'app_id'            =>  $this->appId,
            'method'            => 'alipay.trade.query',             //接口名称
            'format'            => 'JSON',
            'charset'           =>  $this->charset,
            'sign_type'         =>  'RSA2',
            'timestamp'         =>  date('Y-m-d H:i:s'),
            'version'           =>  '1.0',
            'biz_content'       =>  json_encode($requestConfigs),
        );
        $commonConfigs["sign"] = $this->generateSign($commonConfigs, $commonConfigs['sign_type']);
        // 支付宝查询商户自定义订单url接口
        $url    = 'https://openapi.alipay.com/gateway.do?charset='.$this->charset;
        $result = $this->curlPost($url,$commonConfigs);
        // 解码结果
        $result = json_decode($result,true);
        return  $result['alipay_trade_query_response'];
    }


    // 生成签名
    public function generateSign($params, $signType = "RSA") {
        return $this->sign($this->getSignContent($params), $signType);
    }
    // 签名
    protected function sign($data, $signType = "RSA") {
        $priKey=$this->rsaPrivateKey;
        $res = "-----BEGIN RSA PRIVATE KEY-----\n" .
            wordwrap($priKey, 64, "\n", true) .
            "\n-----END RSA PRIVATE KEY-----";
        ($res) or die('您使用的私钥格式错误，请检查RSA私钥配置');
        if ("RSA2" == $signType) {
            openssl_sign($data, $sign, $res, version_compare(PHP_VERSION,'5.4.0', '<') ? SHA256 : OPENSSL_ALGO_SHA256); //OPENSSL_ALGO_SHA256是php5.4.8以上版本才支持
        } else {
            openssl_sign($data, $sign, $res);
        }
        $sign = base64_encode($sign);
        return $sign;
    }

    // 获取签名内容
    public function getSignContent($params) {
        #函数对关联数组按照键名进行升序排序
        ksort($params);
        $stringToBeSigned = "";
        $i = 0;
        foreach ($params as $k => $v) {
            if (false === $this->checkEmpty($v) && "@" != substr($v, 0, 1)) {
                // 转换成目标字符集
                $v = $this->characet($v, $this->charset);
                if ($i == 0) {
                    $stringToBeSigned .= "$k" . "=" . "$v";
                } else {
                    $stringToBeSigned .= "&" . "$k" . "=" . "$v";
                }
                $i++;
            }
        }
        unset ($k, $v);
        return $stringToBeSigned;
    }

    /**
     * 校验$value是否非空
     *  if not set ,return true;
     *  if is null , return true;
     **/
    protected function checkEmpty($value) {
        if (!isset($value))
            return true;
        if ($value === null)
            return true;
        if (trim($value) === "")
            return true;
        return false;
    }

    /**
     * 转换字符集编码
     * @param $data
     * @param $targetCharset
     * @return string
     */
    public function characet($data, $targetCharset) {
        if (!empty($data)) {
            $fileType = $this->charset;
            if (strcasecmp($fileType, $targetCharset) != 0) {
                $data = mb_convert_encoding($data, $targetCharset, $fileType);
                //$data = iconv($fileType, $targetCharset.'//IGNORE', $data);
            }
        }
        return $data;
    }

    // curl请求通信
    public function curlPost($url = '', $postData = '', $options = array())
    {
        if (is_array($postData)) {
            $postData = http_build_query($postData);
        }
        $ch = curl_init();
        curl_setopt($ch, CURLOPT_URL, $url);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, 1);
        curl_setopt($ch, CURLOPT_POST, 1);
        curl_setopt($ch, CURLOPT_POSTFIELDS, $postData);
        curl_setopt($ch, CURLOPT_TIMEOUT, 30); //设置cURL允许执行的最长秒数
        curl_setopt($ch, CURLOPT_HTTPHEADER, array('content-type: application/x-www-form-urlencoded;charset=' . $this->charset));
        if (!empty($options)) {
            curl_setopt_array($ch, $options);
        }
        //https请求 不验证证书和host
        curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
        curl_setopt($ch, CURLOPT_SSL_VERIFYHOST, false);
        $data = curl_exec($ch);
        curl_close($ch);
        return $data;
    }
}
