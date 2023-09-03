@echo off
set var=%date:~8,2%%date:~11,2%
set src=e:\ktt\express\
set send=%src%%var%\
set bak=e:\ktt\dailybill\%var%\bak\
echo %date%
if not exist %send% (
	mkdir %send%
)
if exist %src%*.* (
	move %src%*.* %send%
	echo the expresses are transfered to %send%!!
)
if not exist e:\ktt\dailybill\%var% (
	mkdir e:\ktt\dailybill\%var%
) 
if not exist %bak% (
	mkdir %bak%
) 

if exist %send% (
	cli huidan %send% %bak%
	echo job completly done!
)
pause

