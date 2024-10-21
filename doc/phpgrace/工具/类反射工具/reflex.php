<?php
/********************************************************
 * 类反射工具 
 * @version   1.1 Beta
 *******************************************************/
namespace phpGrace\tools;
class reflex {
	public static function r($className) {
		$ref        = new \ReflectionClass($className);
		echo '<style>*{font-size:14px; padding:0; font-family:"微软雅黑";}</style><div style="line-height:2.2em;">';
		echo '<b>文件位置 </b>:<br />';
		echo $ref->getFileName().'<br />';
		echo '属性 : <br />';
		$properties = $ref->getProperties();
		if(!empty($properties)) {
			foreach($properties as $v) {
				echo str_replace(array('<','>'), '', $v).'<br />';
			}
		}
		echo '<b>类内常量  </b>: <br />';
		$constants = $ref->getConstants();
		if(!empty($constants)) {
			foreach($constants as $k => $v) {
				echo "{$k} => {$v}<br />";
			}
		}
		echo '<b>方法  </b>: <br />';
		$methods = $ref->getMethods();
		if(!empty($methods)) {
			foreach($methods as $v) {
				echo str_replace(array('<','>'), '', $v).'<br />';
			}
		}
		echo '</div>';
	}
}