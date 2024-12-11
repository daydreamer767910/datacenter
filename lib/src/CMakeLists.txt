cmake_minimum_required(VERSION 3.10)
project(mylib VERSION 1.0 LANGUAGES CXX)

set(CMAKE_CXX_STANDARD 17)

# 添加源文件
add_library(mylib SHARED main.cpp)

# 指定输出目录
set_target_properties(mylib PROPERTIES
    ARCHIVE_OUTPUT_DIRECTORY ${CMAKE_BINARY_DIR}/lib
    LIBRARY_OUTPUT_DIRECTORY ${CMAKE_BINARY_DIR}/lib
)

# Install library
install(TARGETS mylib
    LIBRARY DESTINATION lib
    ARCHIVE DESTINATION lib
    RUNTIME DESTINATION bin
)

# 安装头文件（如果需要）
#install(FILES main.h DESTINATION include)

