<?php
/********************************************************
 * curl通信类 
 * @version   1.1 Beta
 *******************************************************/
namespace phpGrace\tools;
class curl {
    public $httpStatus; //curl 状态
    public $curlHndle;  //获取 curl 资源对象
    public $speed;      //传输时间毫秒
    public $timeOut = 60;

    public function __construct(){
        $this->curlHandle = curl_init();
        curl_setopt($this->curlHandle, CURLOPT_TIMEOUT, $this->timeOut);
    }

    public function setopt($key, $val){
        curl_setopt($this->curlHandle, $key , $val);
    }

    public function get($url){
        curl_setopt($this->curlHandle, CURLOPT_URL            , $url);
        curl_setopt($this->curlHandle, CURLOPT_RETURNTRANSFER , true);
        curl_setopt($this->curlHandle, CURLOPT_SSL_VERIFYPEER , false);
        curl_setopt($this->curlHandle, CURLOPT_SSL_VERIFYHOST , false);
        curl_setopt($this->curlHandle, CURLOPT_ENCODING       , 'gzip,deflate');
        curl_setopt($this->curlHandle, CURLOPT_TIMEOUT        , $this->timeOut);
        curl_setopt($this->curlHandle,CURLOPT_USERAGENT,"Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/90.0.4430.93 Safari/537.36");//模拟浏览器

        $result =  curl_exec($this->curlHandle);
        $this->http_status = curl_getinfo($this->curlHandle);
        $this->speed       = round($this->httpStatus['pretransfer_time']*1000, 2);
        return $result;
    }

    public function post($url, $data){
        //如果参数为数组，自动拼接生成URL参数字符串
        if (is_array($data)) {
            $data = http_build_query($data);
        }
        curl_setopt($this->curlHandle, CURLOPT_POST, 1);
        curl_setopt($this->curlHandle, CURLOPT_POSTFIELDS, $data);
        return $this->get($url);
    }
}