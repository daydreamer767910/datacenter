@echo off
set var=%date:~8,2%%date:~11,2%
set src=e:\ktt\dailybill\
set send=%src%%var%\
set bak=%src%%var%\bak\
echo %date%
if not exist %send% (
	mkdir %send%
) 
if not exist %bak% (
	mkdir %bak%
) 
move %src%*.xlsx %bak%
echo the bills are transfered to %bak%!!

if exist %send% (
	cli paidan %bak% %send%
	echo job completly done!
)
pause

