# datacenter
This is a demo to collect the ktt billing data, saving to the files system and database of mysql. The demo is sort of a coding guild for junior typescript programmer, showing some examples about how to operate excel files, connect and use mysql, semaphore/mutex and message queue, socket programming, etc.
Before running the cli/ktt, you need to configure the .env files and the direction folder to collecting the billing data, as well as installing and create the database named 'kttdatabase'. If you need to run the 'test' command by cli, function the dynamic C/C++ library, you also need to install the accordingly tools including gcc, python...

huggingface-cli download meta-llama/Llama-3.2-3B --local-dir models/Llama-3.2-3B
huggingface-cli download deepseek-ai/DeepSeek-R1-Distill-Qwen-7B --local-dir models/DeepSeek-R1-Distill-Qwen-7B
huggingface-cli download deepseek-ai/DeepSeek-R1-Distill-Qwen-1.5B --local-dir models/DeepSeek-R1-Distill-Qwen-1.5B

python3 convert_hf_to_gguf.py ./models/Llama-3.2-3B --outtype q8_0 --outfile models/Llama-3.2-3B.gguf
python3 convert_hf_to_gguf.py ./models/DeepSeek-R1-Distill-Qwen-7B --outtype q8_0 --outfile models/deepseek-r1.7B.Q8_K_M.gguf
python3 convert_hf_to_gguf.py ./models/DeepSeek-R1-Distill-Qwen-1.5B --outtype q8_0 --outfile models/deepseek-r1.1.5B.Q8_K_M.gguf

docker run --rm -it --name llama-deepseek -p 8080:8080 -v E:/bill/develope/CPlus/llama.cpp/models:/models ghcr.io/ggml-org/llama.cpp:server --model /models/deepseek-r1.1.5B.Q8_K_M.gguf --ctx-size 2048 --batch-size 1024 --threads 8

