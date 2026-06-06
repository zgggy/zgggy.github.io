# 单头文件 C++实现一个多层状态机的库

继上次实现[状态机库](https://gitee.com/zgggy/autofsm/tree/old_version/)后，总结了一些不太容易修复的 bug，于是把它果断作为了一个抛弃原型，重构！

[新的状态机库](https://gitee.com/zgggy/autofsm/)应当做到以下几点：

1. 更简洁
   - 之前的 autofsm 库通过`State`,`Transition`,`Condition`和`Machine`四个类构成，通过枚举进行状态和转移的注册，且注册过程略显复杂。
   - 新的 autofsm 库将`Machine`的功能融入到`State`当中，取消`Condition`类，直接将函数注册到`Transition`中。
   - 新的 autofsm 库仅需枚举`State`，不再需要对`Transition`进行枚举，大大减少了用户篇幅。
2. 更鲁棒
   - 之前的 autofsm 库在上层状态切换时存在下层状态的`Enter`和`Exit`函数不会进入的问题，受限于架构不好修复。
   - 新的 autofsm 库在`Enter`函数和`Exit`函数处均作了递归调用的处理。
3. 更强大
   - 之前的 autofsm 库只实现了状态机的一些基础功能，并未提供更加丰富和强大的接口供调用。
   - 新的 autofsm 库提供了 pause 模式，除了状态退出式转移，还支持了状态暂停式转移。
   - 新的 autofsm 库提供了 busy 模式，即正在运行的任一层子状态状态无法退出时无法转移状态。
   - 新的 autofsm 库支持了事件，与转移进行区分。事件实现为回调，由用户发布，而转移由状态机自动处理。

## 状态机架构

autofsm 的主要结构如下：

```cpp
class Trasition {
    vec<func> conditions
    vec<func> prepare_actions
    vec<func> before_actions
    vec<func> after_actions
};

class State {
    map<int, State*> childs
    map<int, Transition*> transitions
    vec<func> on_enter_actions
    vec<func> in_process_actions
    vec<func> on_exit_actions
};
```

## 用法

autofsm 的主要思想是提供一个按照状态自动化执行不同部分代码的库，这些代码通过函数实现，并作为参数传入库的接口，使其能在恰当的时候被自动调用。

### 简单的例子

看一个简单的例子：

```cpp
/* step 1, decl all states with enum, remember decl top to include all real states */
enum States {top, play, eat};

/* step 2, decl your system: Cat, register states and transitions in the constructor and bind them to the corresponding functions.  */
class Cat {
  private:
    int feed_{0};
  public:
    fsm::State<Cat> machine_;
    Cat() : machine_(top, this) {
        machine_.add_child(play, &Cat::play_process);
        machine_.add_child(eat, &Cat::eat_process);
        machine_.child(play)->reg_transition(eat, &Cat::play_eat);
        machine_.child(eat)->reg_transition(play, &Cat::eat_play);
    }

/* step 3, decl all functions you have registered above */
    void play_process() { feed_ -= 1; }
    void eat_process() { feed_ += 2; }
    bool play_eat() { return feed_ < 1; }
    bool eat_play() { return feed >= 100; }
};

/* step 4, call your system in a loop */
int main() {
    Cat cat;
    while (true) {
        cat.machine_.process();
        std::this_thread::sleep_for(std::chrono::milliseconds(100));
    }
}
```

### 更复杂的系统

当一个系统更复杂时，对其声明不可能仅存在于一个文件当中，没关系，别忘了 C++中.cpp 文件可以引用同一个头文件分别实现其中的某些函数。以下是一个复杂的例子，以文件目录呈现：

```text

task: waiting, executing, just_complate
waiting: not_ready, idle, plan
executing: cruise, stop

- planning
    - autofsm.h
    - my_decider.h
    - top/
        - top.cc
        - task/
            - waiting.cc
            - waiting_trans.cc
            - executing.cc
            - executing_trans.cc
            - just_complate.cc (with just_complate trans)
            - waiting/
                - not_ready.cc
                - idle.cc
                - plan.cc
            - executing/
                - cruise.cc
                - stop.cc
    - other
```

当一个系统有状态的个数和层数都较多时，可以有组织的将 .cc 文件分布在文件夹中，记得编译即可。
