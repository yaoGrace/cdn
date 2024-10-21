<?php
/**
 * 服务器信息类
 * @version   1.1 Beta
 */
namespace phpGrace\tools;
class server{
 	public static function info(){
		//服务器操作系统
		$arr['system'] =  php_uname('s').php_uname('r');
		//php版本
		$arr['phpversion'] = PHP_VERSION;
		//服务器默认时区
		$arr['datetime'] = date_default_timezone_get().' | '.date('Y-m-d H:i:s');
		//最大上传内存限制
		$arr['maxuploade'] = ini_get('upload_max_filesize');
		//最大运行时间
		$arr['maxexetime'] = ini_get('max_execution_time');
		//php运行模式
		$arr['moshi'] = php_sapi_name();
		//gd库信息
		if(function_exists("gd_info")){ 
			$gd = gd_info();
			$arr['gd'] = $gd['GD Version'];
		}else{
			$arr['gd'] = "未知";
		}
		//服务器解释引擎 比如：Apache 或者 ngix
        $arr['yinqing'] = $_SERVER['SERVER_SOFTWARE'];
		//服务器ip
        $arr['serverip'] = $_SERVER['SERVER_ADDR'];
        //脚本运行占用最大内存
        $arr['memory_limit'] =get_cfg_var ("memory_limit")?get_cfg_var("memory_limit"):"无";
        //获取服务器域名（主机名）
        $arr['httphost'] = $_SERVER["HTTP_HOST"];
        //获取服务器语言
        $arr['serverLanguage'] = $_SERVER['HTTP_ACCEPT_LANGUAGE'];
        //获取服务器Web端口
        $arr['port'] =  $_SERVER['SERVER_PORT'];
        //根目录可用空间
        $arr['free_space'] =  round(disk_free_space(PG_APP_ROOT)/1024/1024  ).'MB';
        //根目录所在磁盘的总空间
        $arr['total_space']=round(disk_total_space(PG_APP_ROOT)/1024/1024/1024)."GB";
        return $arr;
	}

 }
