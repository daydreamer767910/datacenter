#include <iostream>

extern "C" void printMessage() {
    std::cout << "Hello from C++ Library!" << std::endl;
}

extern "C" int add(int a, int b) {
    return a + b;
}