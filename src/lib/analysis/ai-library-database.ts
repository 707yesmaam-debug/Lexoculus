/**
 * AI/ML Library Knowledge Base
 * 
 * Comprehensive database of known AI/ML libraries with metadata for
 * deterministic capability detection without LLM.
 * 
 * Structure:
 * - Libraries grouped by ecosystem (Python, JavaScript, Rust, Go, etc.)
 * - Each library has aliases, category, risk indicators, and confidence
 * - Used by dependency-scanner.ts for fast pattern matching
 */

// =============================================================================
// TYPE DEFINITIONS
// =============================================================================

export type AICategory =
    | 'deep_learning'
    | 'computer_vision'
    | 'nlp'
    | 'speech'
    | 'generative_ai'
    | 'reinforcement_learning'
    | 'recommendation'
    | 'tabular_ml'
    | 'time_series'
    | 'biometrics'
    | 'data_processing'
    | 'mlops'
    | 'autonomous_systems';

export type RiskIndicatorKey =
    | 'uses_computer_vision'
    | 'uses_biometric_processing'
    | 'uses_emotion_recognition'
    | 'uses_critical_infrastructure'
    | 'uses_generative_ai'
    | 'uses_nlp'
    | 'uses_nlp_decision_making'
    | 'targets_vulnerable_persons'
    | 'high_impact_decision_making';

export interface AILibrary {
    /** Primary package name (as appears in package manager) */
    name: string;

    /** Alternative names/spellings */
    aliases: string[];

    /** Primary category */
    category: AICategory;

    /** Secondary categories if applicable */
    secondary_categories?: AICategory[];

    /** Risk indicators this library might trigger */
    risk_indicators: RiskIndicatorKey[];

    /** Ecosystem: python, javascript, rust, go, etc. */
    ecosystem: string;

    /** Framework associations */
    frameworks?: string[];

    /** Confidence that this library indicates AI usage (0-1) */
    confidence: number;

    /** Common use cases */
    use_cases?: string[];

    /** High-risk flag: libraries specifically for biometrics, surveillance, etc. */
    high_risk_flag?: boolean;
}

// =============================================================================
// PYTHON LIBRARIES - DEEP LEARNING
// =============================================================================

const PYTHON_DEEP_LEARNING: AILibrary[] = [
    {
        name: 'torch',
        aliases: ['pytorch', 'torch-cuda', 'torch-cpu', 'pytorch-lightning', 'lightning'],
        category: 'deep_learning',
        risk_indicators: [],
        ecosystem: 'python',
        frameworks: ['PyTorch'],
        confidence: 0.95,
        use_cases: ['neural networks', 'deep learning', 'computer vision', 'NLP']
    },
    {
        name: 'tensorflow',
        aliases: ['tf', 'tensorflow-gpu', 'tensorflow-cpu', 'tf-nightly', 'tensorflow-io', 'tensorflow-base', 'tensorflow-estimator'],
        category: 'deep_learning',
        risk_indicators: [],
        ecosystem: 'python',
        frameworks: ['TensorFlow'],
        confidence: 0.95,
        use_cases: ['neural networks', 'deep learning', 'production ML']
    },
    {
        name: 'keras',
        aliases: ['keras-core', 'keras-cv', 'keras-nlp'],
        category: 'deep_learning',
        risk_indicators: [],
        ecosystem: 'python',
        frameworks: ['Keras', 'TensorFlow'],
        confidence: 0.95,
        use_cases: ['neural networks', 'deep learning', 'rapid prototyping']
    },
    {
        name: 'jax',
        aliases: ['jaxlib', 'flax', 'optax', 'haiku'],
        category: 'deep_learning',
        risk_indicators: [],
        ecosystem: 'python',
        frameworks: ['JAX'],
        confidence: 0.95,
        use_cases: ['high-performance ML', 'research', 'TPU acceleration']
    },
    {
        name: 'mxnet',
        aliases: ['gluon', 'gluoncv', 'gluonnlp'],
        category: 'deep_learning',
        risk_indicators: [],
        ecosystem: 'python',
        frameworks: ['MXNet'],
        confidence: 0.9,
        use_cases: ['neural networks', 'scalable training']
    },
    {
        name: 'paddle',
        aliases: ['paddlepaddle', 'paddlenlp', 'paddlecv', 'paddleocr'],
        category: 'deep_learning',
        risk_indicators: [],
        ecosystem: 'python',
        frameworks: ['PaddlePaddle'],
        confidence: 0.9,
        use_cases: ['neural networks', 'Chinese NLP', 'OCR']
    },
];

// =============================================================================
// PYTHON LIBRARIES - COMPUTER VISION
// =============================================================================

const PYTHON_COMPUTER_VISION: AILibrary[] = [
    {
        name: 'opencv-python',
        aliases: ['opencv', 'cv2', 'opencv-contrib-python', 'opencv-python-headless'],
        category: 'computer_vision',
        risk_indicators: ['uses_computer_vision'],
        ecosystem: 'python',
        confidence: 0.85,
        use_cases: ['image processing', 'video analysis', 'object detection']
    },
    {
        name: 'torchvision',
        aliases: ['vision'],
        category: 'computer_vision',
        risk_indicators: ['uses_computer_vision'],
        ecosystem: 'python',
        frameworks: ['PyTorch'],
        confidence: 0.9,
        use_cases: ['image classification', 'object detection', 'segmentation']
    },
    {
        name: 'ultralytics',
        aliases: ['yolo', 'yolov5', 'yolov8', 'yolov9', 'yolov10'],
        category: 'computer_vision',
        risk_indicators: ['uses_computer_vision'],
        ecosystem: 'python',
        confidence: 0.95,
        use_cases: ['object detection', 'real-time detection', 'tracking']
    },
    {
        name: 'detectron2',
        aliases: ['detectron'],
        category: 'computer_vision',
        risk_indicators: ['uses_computer_vision'],
        ecosystem: 'python',
        frameworks: ['PyTorch'],
        confidence: 0.95,
        use_cases: ['object detection', 'segmentation', 'pose estimation']
    },
    {
        name: 'mmdet',
        aliases: ['mmdetection', 'mmcv', 'mmpose', 'mmsegmentation'],
        category: 'computer_vision',
        risk_indicators: ['uses_computer_vision'],
        ecosystem: 'python',
        frameworks: ['PyTorch'],
        confidence: 0.95,
        use_cases: ['object detection', 'pose estimation', 'segmentation']
    },
    {
        name: 'pillow',
        aliases: ['pil', 'PIL'],
        category: 'data_processing',
        secondary_categories: ['computer_vision'],
        risk_indicators: [],
        ecosystem: 'python',
        confidence: 0.3, // Low - just image processing, not necessarily AI
        use_cases: ['image loading', 'image manipulation']
    },
    {
        name: 'albumentations',
        aliases: [],
        category: 'computer_vision',
        risk_indicators: ['uses_computer_vision'],
        ecosystem: 'python',
        confidence: 0.85,
        use_cases: ['image augmentation', 'training data preparation']
    },
];

// =============================================================================
// PYTHON LIBRARIES - BIOMETRICS (HIGH RISK)
// =============================================================================

const PYTHON_BIOMETRICS: AILibrary[] = [
    {
        name: 'face_recognition',
        aliases: ['face-recognition', 'facerecognition'],
        category: 'biometrics',
        risk_indicators: ['uses_computer_vision', 'uses_biometric_processing'],
        ecosystem: 'python',
        confidence: 0.99,
        high_risk_flag: true,
        use_cases: ['face detection', 'face recognition', 'identity verification']
    },
    {
        name: 'deepface',
        aliases: ['deep-face'],
        category: 'biometrics',
        risk_indicators: ['uses_computer_vision', 'uses_biometric_processing', 'uses_emotion_recognition'],
        ecosystem: 'python',
        confidence: 0.99,
        high_risk_flag: true,
        use_cases: ['face recognition', 'face verification', 'emotion detection', 'age/gender estimation']
    },
    {
        name: 'insightface',
        aliases: ['arcface'],
        category: 'biometrics',
        risk_indicators: ['uses_computer_vision', 'uses_biometric_processing'],
        ecosystem: 'python',
        confidence: 0.99,
        high_risk_flag: true,
        use_cases: ['face recognition', 'face analysis']
    },
    {
        name: 'fer',
        aliases: ['facial-emotion-recognition', 'emotion-recognition'],
        category: 'biometrics',
        risk_indicators: ['uses_computer_vision', 'uses_emotion_recognition'],
        ecosystem: 'python',
        confidence: 0.99,
        high_risk_flag: true,
        use_cases: ['emotion detection', 'facial expression analysis']
    },
    {
        name: 'dlib',
        aliases: [],
        category: 'biometrics',
        secondary_categories: ['computer_vision'],
        risk_indicators: ['uses_computer_vision', 'uses_biometric_processing'],
        ecosystem: 'python',
        confidence: 0.8,
        use_cases: ['face detection', 'facial landmarks', 'object tracking']
    },
    {
        name: 'mediapipe',
        aliases: ['mediapipe-model-maker'],
        category: 'computer_vision',
        secondary_categories: ['biometrics'],
        risk_indicators: ['uses_computer_vision', 'uses_biometric_processing'],
        ecosystem: 'python',
        confidence: 0.85,
        use_cases: ['face detection', 'hand tracking', 'pose estimation', 'gesture recognition']
    },
];

// =============================================================================
// PYTHON LIBRARIES - NLP
// =============================================================================

const PYTHON_NLP: AILibrary[] = [
    {
        name: 'transformers',
        aliases: ['huggingface-transformers', 'hf-transformers'],
        category: 'nlp',
        secondary_categories: ['generative_ai'],
        risk_indicators: ['uses_nlp'],
        ecosystem: 'python',
        frameworks: ['Hugging Face', 'PyTorch', 'TensorFlow'],
        confidence: 0.95,
        use_cases: ['text classification', 'NER', 'question answering', 'text generation']
    },
    {
        name: 'spacy',
        aliases: ['spacy-transformers', 'spacy-llm'],
        category: 'nlp',
        risk_indicators: ['uses_nlp'],
        ecosystem: 'python',
        confidence: 0.9,
        use_cases: ['NER', 'POS tagging', 'text processing', 'information extraction']
    },
    {
        name: 'nltk',
        aliases: ['natural-language-toolkit'],
        category: 'nlp',
        risk_indicators: ['uses_nlp'],
        ecosystem: 'python',
        confidence: 0.7,
        use_cases: ['text processing', 'tokenization', 'stemming', 'educational NLP']
    },
    {
        name: 'gensim',
        aliases: [],
        category: 'nlp',
        risk_indicators: ['uses_nlp'],
        ecosystem: 'python',
        confidence: 0.85,
        use_cases: ['topic modeling', 'word embeddings', 'document similarity']
    },
    {
        name: 'sentence-transformers',
        aliases: ['sentence_transformers', 'sbert'],
        category: 'nlp',
        risk_indicators: ['uses_nlp'],
        ecosystem: 'python',
        frameworks: ['Hugging Face'],
        confidence: 0.9,
        use_cases: ['semantic search', 'text embeddings', 'similarity matching']
    },
    {
        name: 'flair',
        aliases: [],
        category: 'nlp',
        risk_indicators: ['uses_nlp'],
        ecosystem: 'python',
        confidence: 0.85,
        use_cases: ['NER', 'POS tagging', 'text classification']
    },
    {
        name: 'stanza',
        aliases: ['stanfordnlp'],
        category: 'nlp',
        risk_indicators: ['uses_nlp'],
        ecosystem: 'python',
        confidence: 0.85,
        use_cases: ['multilingual NLP', 'dependency parsing', 'NER']
    },
];

// =============================================================================
// PYTHON LIBRARIES - GENERATIVE AI / LLM
// =============================================================================

const PYTHON_GENERATIVE_AI: AILibrary[] = [
    {
        name: 'openai',
        aliases: ['openai-python'],
        category: 'generative_ai',
        risk_indicators: ['uses_generative_ai', 'uses_nlp'],
        ecosystem: 'python',
        confidence: 0.95,
        use_cases: ['GPT', 'DALL-E', 'text generation', 'image generation']
    },
    {
        name: 'anthropic',
        aliases: [],
        category: 'generative_ai',
        risk_indicators: ['uses_generative_ai', 'uses_nlp'],
        ecosystem: 'python',
        confidence: 0.95,
        use_cases: ['Claude', 'text generation', 'AI assistants']
    },
    {
        name: 'langchain',
        aliases: ['langchain-core', 'langchain-community', 'langchain-openai'],
        category: 'generative_ai',
        risk_indicators: ['uses_generative_ai', 'uses_nlp'],
        ecosystem: 'python',
        confidence: 0.95,
        use_cases: ['LLM orchestration', 'RAG', 'agents', 'chains']
    },
    {
        name: 'llama-index',
        aliases: ['llamaindex', 'llama_index', 'gpt-index'],
        category: 'generative_ai',
        risk_indicators: ['uses_generative_ai', 'uses_nlp'],
        ecosystem: 'python',
        confidence: 0.95,
        use_cases: ['RAG', 'document indexing', 'LLM data frameworks']
    },
    {
        name: 'diffusers',
        aliases: [],
        category: 'generative_ai',
        risk_indicators: ['uses_generative_ai', 'uses_computer_vision'],
        ecosystem: 'python',
        frameworks: ['Hugging Face'],
        confidence: 0.95,
        use_cases: ['image generation', 'Stable Diffusion', 'inpainting']
    },
    {
        name: 'stability-sdk',
        aliases: ['stability-ai'],
        category: 'generative_ai',
        risk_indicators: ['uses_generative_ai', 'uses_computer_vision'],
        ecosystem: 'python',
        confidence: 0.95,
        use_cases: ['image generation', 'Stable Diffusion']
    },
    {
        name: 'replicate',
        aliases: [],
        category: 'generative_ai',
        risk_indicators: ['uses_generative_ai'],
        ecosystem: 'python',
        confidence: 0.85,
        use_cases: ['model hosting', 'AI inference', 'various AI models']
    },
    {
        name: 'cohere',
        aliases: ['cohere-python'],
        category: 'generative_ai',
        risk_indicators: ['uses_generative_ai', 'uses_nlp'],
        ecosystem: 'python',
        confidence: 0.95,
        use_cases: ['text generation', 'embeddings', 'classification']
    },
    {
        name: 'groq',
        aliases: [],
        category: 'generative_ai',
        risk_indicators: ['uses_generative_ai', 'uses_nlp'],
        ecosystem: 'python',
        confidence: 0.95,
        use_cases: ['fast LLM inference', 'Llama', 'Mixtral']
    },
    {
        name: 'litellm',
        aliases: [],
        category: 'generative_ai',
        risk_indicators: ['uses_generative_ai', 'uses_nlp'],
        ecosystem: 'python',
        confidence: 0.95,
        use_cases: ['LLM orchestration', 'API routing', 'multi-model support']
    },
    {
        name: 'ollama',
        aliases: [],
        category: 'generative_ai',
        risk_indicators: ['uses_generative_ai', 'uses_nlp'],
        ecosystem: 'python',
        confidence: 0.95,
        use_cases: ['local LLMs', 'Llama', 'self-hosted AI']
    },
    {
        name: 'vllm',
        aliases: [],
        category: 'generative_ai',
        risk_indicators: ['uses_generative_ai', 'uses_nlp'],
        ecosystem: 'python',
        confidence: 0.95,
        use_cases: ['LLM serving', 'high-throughput inference']
    },
    {
        name: 'ctransformers',
        aliases: [],
        category: 'generative_ai',
        risk_indicators: ['uses_generative_ai', 'uses_nlp'],
        ecosystem: 'python',
        confidence: 0.95,
        use_cases: ['local LLMs', 'GGML models']
    },
    {
        name: 'llama-cpp-python',
        aliases: ['llama_cpp', 'llamacpp'],
        category: 'generative_ai',
        risk_indicators: ['uses_generative_ai', 'uses_nlp'],
        ecosystem: 'python',
        confidence: 0.95,
        use_cases: ['local LLMs', 'GGUF models', 'CPU inference']
    },
];

// =============================================================================
// PYTHON LIBRARIES - SPEECH
// =============================================================================

const PYTHON_SPEECH: AILibrary[] = [
    {
        name: 'whisper',
        aliases: ['openai-whisper'],
        category: 'speech',
        risk_indicators: ['uses_nlp'],
        ecosystem: 'python',
        confidence: 0.95,
        use_cases: ['speech-to-text', 'transcription', 'audio processing']
    },
    {
        name: 'speechrecognition',
        aliases: ['speech_recognition', 'speech-recognition'],
        category: 'speech',
        risk_indicators: [],
        ecosystem: 'python',
        confidence: 0.8,
        use_cases: ['speech-to-text', 'voice commands']
    },
    {
        name: 'pyaudio',
        aliases: [],
        category: 'speech',
        risk_indicators: [],
        ecosystem: 'python',
        confidence: 0.4, // Low - audio capture, not necessarily AI
        use_cases: ['audio capture', 'audio playback']
    },
    {
        name: 'torchaudio',
        aliases: [],
        category: 'speech',
        risk_indicators: [],
        ecosystem: 'python',
        frameworks: ['PyTorch'],
        confidence: 0.85,
        use_cases: ['audio processing', 'speech recognition', 'audio ML']
    },
    {
        name: 'pyttsx3',
        aliases: [],
        category: 'speech',
        risk_indicators: [],
        ecosystem: 'python',
        confidence: 0.5,
        use_cases: ['text-to-speech']
    },
    {
        name: 'elevenlabs',
        aliases: [],
        category: 'speech',
        secondary_categories: ['generative_ai'],
        risk_indicators: ['uses_generative_ai'],
        ecosystem: 'python',
        confidence: 0.95,
        use_cases: ['voice cloning', 'AI voice generation', 'TTS']
    },
];

// =============================================================================
// PYTHON LIBRARIES - TABULAR ML
// =============================================================================

const PYTHON_TABULAR_ML: AILibrary[] = [
    {
        name: 'scikit-learn',
        aliases: ['sklearn', 'sk-learn'],
        category: 'tabular_ml',
        risk_indicators: [],
        ecosystem: 'python',
        confidence: 0.85,
        use_cases: ['classification', 'regression', 'clustering', 'traditional ML']
    },
    {
        name: 'xgboost',
        aliases: [],
        category: 'tabular_ml',
        risk_indicators: [],
        ecosystem: 'python',
        confidence: 0.9,
        use_cases: ['gradient boosting', 'tabular prediction', 'competitions']
    },
    {
        name: 'lightgbm',
        aliases: ['lgbm'],
        category: 'tabular_ml',
        risk_indicators: [],
        ecosystem: 'python',
        confidence: 0.9,
        use_cases: ['gradient boosting', 'fast training', 'tabular data']
    },
    {
        name: 'catboost',
        aliases: [],
        category: 'tabular_ml',
        risk_indicators: [],
        ecosystem: 'python',
        confidence: 0.9,
        use_cases: ['gradient boosting', 'categorical features', 'tabular data']
    },
    {
        name: 'shap',
        aliases: [],
        category: 'tabular_ml',
        risk_indicators: [],
        ecosystem: 'python',
        confidence: 0.7,
        use_cases: ['model explainability', 'feature importance']
    },
    {
        name: 'lime',
        aliases: [],
        category: 'tabular_ml',
        risk_indicators: [],
        ecosystem: 'python',
        confidence: 0.7,
        use_cases: ['model explainability', 'local interpretable explanations']
    },
];

// =============================================================================
// PYTHON LIBRARIES - MLOPS / DATA PROCESSING
// =============================================================================

const PYTHON_MLOPS: AILibrary[] = [
    {
        name: 'numpy',
        aliases: ['np'],
        category: 'data_processing',
        risk_indicators: [],
        ecosystem: 'python',
        confidence: 0.3, // Low - very common, not necessarily AI
        use_cases: ['numerical computing', 'array operations']
    },
    {
        name: 'pandas',
        aliases: ['pd'],
        category: 'data_processing',
        risk_indicators: [],
        ecosystem: 'python',
        confidence: 0.3, // Low - data processing, not necessarily AI
        use_cases: ['data manipulation', 'dataframes', 'data analysis']
    },
    {
        name: 'mlflow',
        aliases: [],
        category: 'mlops',
        risk_indicators: [],
        ecosystem: 'python',
        confidence: 0.85,
        use_cases: ['experiment tracking', 'model registry', 'deployment']
    },
    {
        name: 'wandb',
        aliases: ['weights-and-biases', 'weights_and_biases'],
        category: 'mlops',
        risk_indicators: [],
        ecosystem: 'python',
        confidence: 0.85,
        use_cases: ['experiment tracking', 'model monitoring', 'visualization']
    },
    {
        name: 'ray',
        aliases: ['ray-serve', 'ray-tune'],
        category: 'mlops',
        risk_indicators: [],
        ecosystem: 'python',
        confidence: 0.75,
        use_cases: ['distributed computing', 'hyperparameter tuning', 'serving']
    },
    {
        name: 'dvc',
        aliases: ['data-version-control'],
        category: 'mlops',
        risk_indicators: [],
        ecosystem: 'python',
        confidence: 0.8,
        use_cases: ['data versioning', 'ML pipelines', 'experiment tracking']
    },
    {
        name: 'onnx',
        aliases: ['onnxruntime', 'onnx-runtime'],
        category: 'mlops',
        risk_indicators: [],
        ecosystem: 'python',
        confidence: 0.9,
        use_cases: ['model interoperability', 'inference optimization']
    },
    {
        name: 'tensorrt',
        aliases: ['tensor-rt'],
        category: 'mlops',
        risk_indicators: [],
        ecosystem: 'python',
        confidence: 0.9,
        use_cases: ['inference optimization', 'NVIDIA deployment']
    },
];

// =============================================================================
// PYTHON LIBRARIES - RECOMMENDATION
// =============================================================================

const PYTHON_RECOMMENDATION: AILibrary[] = [
    {
        name: 'surprise',
        aliases: ['scikit-surprise'],
        category: 'recommendation',
        risk_indicators: [],
        ecosystem: 'python',
        confidence: 0.9,
        use_cases: ['collaborative filtering', 'rating prediction']
    },
    {
        name: 'implicit',
        aliases: [],
        category: 'recommendation',
        risk_indicators: [],
        ecosystem: 'python',
        confidence: 0.9,
        use_cases: ['implicit feedback', 'collaborative filtering']
    },
    {
        name: 'recbole',
        aliases: [],
        category: 'recommendation',
        risk_indicators: [],
        ecosystem: 'python',
        confidence: 0.95,
        use_cases: ['recommendation systems', 'deep learning recommenders']
    },
    {
        name: 'lenskit',
        aliases: [],
        category: 'recommendation',
        risk_indicators: [],
        ecosystem: 'python',
        confidence: 0.9,
        use_cases: ['recommendation research', 'collaborative filtering']
    },
];

// =============================================================================
// PYTHON LIBRARIES - REINFORCEMENT LEARNING
// =============================================================================

const PYTHON_RL: AILibrary[] = [
    {
        name: 'gymnasium',
        aliases: ['gym', 'openai-gym', 'atari-py', 'ale-py'],
        category: 'reinforcement_learning',
        risk_indicators: [],
        ecosystem: 'python',
        confidence: 0.95, // Bumped to high-confidence as it's the core of RL
        use_cases: ['RL environments', 'agent training']
    },
    {
        name: 'stable-baselines',
        aliases: ['stable_baselines', 'sb2'],
        category: 'reinforcement_learning',
        risk_indicators: [],
        ecosystem: 'python',
        confidence: 0.95,
        use_cases: ['RL algorithms (legacy)', 'policy learning']
    },
    {
        name: 'stable-baselines3',
        aliases: ['stable_baselines3', 'sb3'],
        category: 'reinforcement_learning',
        risk_indicators: [],
        ecosystem: 'python',
        confidence: 0.95,
        use_cases: ['RL algorithms', 'policy learning']
    },
    {
        name: 'rl',
        aliases: ['cleanrl'],
        category: 'reinforcement_learning',
        risk_indicators: [],
        ecosystem: 'python',
        confidence: 0.85,
        use_cases: ['RL research', 'algorithm implementations']
    },
    {
        name: 'rllib',
        aliases: ['ray-rllib'],
        category: 'reinforcement_learning',
        risk_indicators: [],
        ecosystem: 'python',
        confidence: 0.95,
        use_cases: ['scalable RL', 'distributed training']
    },
];

// =============================================================================
// JAVASCRIPT LIBRARIES
// =============================================================================

const JAVASCRIPT_LIBRARIES: AILibrary[] = [
    // Deep Learning
    {
        name: '@tensorflow/tfjs',
        aliases: ['tensorflow.js', 'tfjs', '@tensorflow/tfjs-node', '@tensorflow/tfjs-node-gpu'],
        category: 'deep_learning',
        risk_indicators: [],
        ecosystem: 'javascript',
        frameworks: ['TensorFlow.js'],
        confidence: 0.95,
        use_cases: ['browser ML', 'Node.js ML', 'transfer learning']
    },
    {
        name: 'onnxruntime-web',
        aliases: ['onnxruntime-node'],
        category: 'deep_learning',
        risk_indicators: [],
        ecosystem: 'javascript',
        confidence: 0.9,
        use_cases: ['ONNX inference', 'model deployment']
    },
    {
        name: 'brain.js',
        aliases: ['brainjs'],
        category: 'deep_learning',
        risk_indicators: [],
        ecosystem: 'javascript',
        confidence: 0.9,
        use_cases: ['neural networks', 'simple ML in browser']
    },
    // NLP
    {
        name: '@xenova/transformers',
        aliases: ['transformers.js'],
        category: 'nlp',
        secondary_categories: ['generative_ai'],
        risk_indicators: ['uses_nlp'],
        ecosystem: 'javascript',
        frameworks: ['Hugging Face'],
        confidence: 0.95,
        use_cases: ['NLP in browser', 'text processing', 'embeddings']
    },
    {
        name: 'natural',
        aliases: [],
        category: 'nlp',
        risk_indicators: ['uses_nlp'],
        ecosystem: 'javascript',
        confidence: 0.8,
        use_cases: ['tokenization', 'stemming', 'classification']
    },
    {
        name: 'compromise',
        aliases: [],
        category: 'nlp',
        risk_indicators: ['uses_nlp'],
        ecosystem: 'javascript',
        confidence: 0.75,
        use_cases: ['text parsing', 'NLP in browser']
    },
    // Generative AI
    {
        name: 'openai',
        aliases: ['openai-node'],
        category: 'generative_ai',
        risk_indicators: ['uses_generative_ai', 'uses_nlp'],
        ecosystem: 'javascript',
        confidence: 0.95,
        use_cases: ['GPT', 'DALL-E', 'text generation']
    },
    {
        name: '@anthropic-ai/sdk',
        aliases: ['anthropic'],
        category: 'generative_ai',
        risk_indicators: ['uses_generative_ai', 'uses_nlp'],
        ecosystem: 'javascript',
        confidence: 0.95,
        use_cases: ['Claude', 'text generation']
    },
    {
        name: 'langchain',
        aliases: ['@langchain/core', '@langchain/openai', '@langchain/anthropic'],
        category: 'generative_ai',
        risk_indicators: ['uses_generative_ai', 'uses_nlp'],
        ecosystem: 'javascript',
        confidence: 0.95,
        use_cases: ['LLM orchestration', 'RAG', 'agents']
    },
    {
        name: 'ai',
        aliases: ['@vercel/ai', 'vercel-ai-sdk'],
        category: 'generative_ai',
        risk_indicators: ['uses_generative_ai', 'uses_nlp'],
        ecosystem: 'javascript',
        confidence: 0.9,
        use_cases: ['AI streaming', 'LLM integration', 'chatbots']
    },
    {
        name: 'replicate',
        aliases: [],
        category: 'generative_ai',
        risk_indicators: ['uses_generative_ai'],
        ecosystem: 'javascript',
        confidence: 0.85,
        use_cases: ['model hosting', 'AI inference']
    },
    // Computer Vision
    {
        name: '@mediapipe/tasks-vision',
        aliases: ['@mediapipe/face_detection', '@mediapipe/hands', '@mediapipe/pose'],
        category: 'computer_vision',
        secondary_categories: ['biometrics'],
        risk_indicators: ['uses_computer_vision', 'uses_biometric_processing'],
        ecosystem: 'javascript',
        confidence: 0.9,
        use_cases: ['face detection', 'hand tracking', 'pose estimation']
    },
    {
        name: 'face-api.js',
        aliases: ['face-api'],
        category: 'biometrics',
        risk_indicators: ['uses_computer_vision', 'uses_biometric_processing', 'uses_emotion_recognition'],
        ecosystem: 'javascript',
        confidence: 0.99,
        high_risk_flag: true,
        use_cases: ['face detection', 'face recognition', 'emotion detection']
    },
    {
        name: 'tracking',
        aliases: ['tracking.js'],
        category: 'computer_vision',
        risk_indicators: ['uses_computer_vision'],
        ecosystem: 'javascript',
        confidence: 0.75,
        use_cases: ['object tracking', 'color tracking', 'face detection']
    },
    // Tabular ML
    {
        name: 'ml5',
        aliases: ['ml5js'],
        category: 'tabular_ml',
        risk_indicators: [],
        ecosystem: 'javascript',
        confidence: 0.8,
        use_cases: ['friendly ML', 'p5.js integration', 'creative coding']
    },
    {
        name: 'mljs',
        aliases: ['ml'],
        category: 'tabular_ml',
        risk_indicators: [],
        ecosystem: 'javascript',
        confidence: 0.85,
        use_cases: ['traditional ML', 'clustering', 'regression']
    },
];

// =============================================================================
// RUST LIBRARIES
// =============================================================================

const RUST_LIBRARIES: AILibrary[] = [
    {
        name: 'tch',
        aliases: ['tch-rs', 'torch-rust'],
        category: 'deep_learning',
        risk_indicators: [],
        ecosystem: 'rust',
        frameworks: ['PyTorch'],
        confidence: 0.95,
        use_cases: ['PyTorch bindings', 'neural networks']
    },
    {
        name: 'candle',
        aliases: ['candle-core', 'candle-nn', 'candle-transformers'],
        category: 'deep_learning',
        risk_indicators: [],
        ecosystem: 'rust',
        frameworks: ['Hugging Face'],
        confidence: 0.95,
        use_cases: ['pure Rust ML', 'transformers', 'LLM inference']
    },
    {
        name: 'burn',
        aliases: [],
        category: 'deep_learning',
        risk_indicators: [],
        ecosystem: 'rust',
        confidence: 0.95,
        use_cases: ['deep learning framework', 'neural networks']
    },
    {
        name: 'linfa',
        aliases: [],
        category: 'tabular_ml',
        risk_indicators: [],
        ecosystem: 'rust',
        confidence: 0.9,
        use_cases: ['scikit-learn equivalent', 'traditional ML']
    },
    {
        name: 'ort',
        aliases: ['onnxruntime', 'onnxruntime-rs'],
        category: 'mlops',
        risk_indicators: [],
        ecosystem: 'rust',
        confidence: 0.9,
        use_cases: ['ONNX inference', 'model deployment']
    },
    {
        name: 'rust-bert',
        aliases: ['rust_bert'],
        category: 'nlp',
        risk_indicators: ['uses_nlp'],
        ecosystem: 'rust',
        confidence: 0.9,
        use_cases: ['NLP pipelines', 'text classification', 'NER']
    },
    {
        name: 'tokenizers',
        aliases: [],
        category: 'nlp',
        risk_indicators: ['uses_nlp'],
        ecosystem: 'rust',
        frameworks: ['Hugging Face'],
        confidence: 0.85,
        use_cases: ['fast tokenization', 'text preprocessing']
    },
];

// =============================================================================
// GO LIBRARIES
// =============================================================================

const GO_LIBRARIES: AILibrary[] = [
    {
        name: 'gorgonia',
        aliases: ['gorgonia.org/gorgonia'],
        category: 'deep_learning',
        risk_indicators: [],
        ecosystem: 'go',
        confidence: 0.9,
        use_cases: ['neural networks', 'deep learning in Go']
    },
    {
        name: 'gonum',
        aliases: ['gonum.org/v1/gonum'],
        category: 'data_processing',
        risk_indicators: [],
        ecosystem: 'go',
        confidence: 0.5,
        use_cases: ['numerical computing', 'linear algebra']
    },
    {
        name: 'goml',
        aliases: [],
        category: 'tabular_ml',
        risk_indicators: [],
        ecosystem: 'go',
        confidence: 0.85,
        use_cases: ['traditional ML', 'classification', 'regression']
    },
    {
        name: 'go-openai',
        aliases: ['openai-go', 'github.com/sashabaranov/go-openai'],
        category: 'generative_ai',
        risk_indicators: ['uses_generative_ai', 'uses_nlp'],
        ecosystem: 'go',
        confidence: 0.95,
        use_cases: ['GPT', 'OpenAI API']
    },
    {
        name: 'langchaingo',
        aliases: ['langchain-go'],
        category: 'generative_ai',
        risk_indicators: ['uses_generative_ai', 'uses_nlp'],
        ecosystem: 'go',
        confidence: 0.95,
        use_cases: ['LLM orchestration', 'RAG']
    },
    {
        name: 'onnxruntime-go',
        aliases: [],
        category: 'mlops',
        risk_indicators: [],
        ecosystem: 'go',
        confidence: 0.9,
        use_cases: ['ONNX inference', 'model deployment']
    },
];

// =============================================================================
// MODEL FILE PATTERNS
// =============================================================================

export const MODEL_FILE_EXTENSIONS = [
    '.pt',           // PyTorch
    '.pth',          // PyTorch
    '.ckpt',         // Checkpoint (various)
    '.h5',           // Keras/TensorFlow
    '.keras',        // Keras
    '.pb',           // TensorFlow SavedModel
    '.onnx',         // ONNX
    '.tflite',       // TensorFlow Lite
    '.mlmodel',      // CoreML
    '.pkl',          // Pickle (sklearn, etc.)
    '.joblib',       // Joblib (sklearn)
    '.safetensors',  // SafeTensors (Hugging Face)
    '.gguf',         // GGUF (llama.cpp)
    '.ggml',         // GGML (legacy)
    '.bin',          // Generic (often model weights)
    '.model',        // Generic model file
];

export const MODEL_FILE_PATTERNS = [
    /model.*\.(pt|pth|h5|onnx|pkl|safetensors|gguf)$/i,
    /weights.*\.(pt|pth|h5|bin|safetensors)$/i,
    /checkpoint.*\.(pt|pth|ckpt)$/i,
    /.*\.safetensors$/i,
    /.*\.gguf$/i,
    /saved_model\.pb$/i,
];

// =============================================================================
// AGGREGATED EXPORTS
// =============================================================================

export const ALL_LIBRARIES: AILibrary[] = [
    ...PYTHON_DEEP_LEARNING,
    ...PYTHON_COMPUTER_VISION,
    ...PYTHON_BIOMETRICS,
    ...PYTHON_NLP,
    ...PYTHON_GENERATIVE_AI,
    ...PYTHON_SPEECH,
    ...PYTHON_TABULAR_ML,
    ...PYTHON_MLOPS,
    ...PYTHON_RECOMMENDATION,
    ...PYTHON_RL,
    ...JAVASCRIPT_LIBRARIES,
    ...RUST_LIBRARIES,
    ...GO_LIBRARIES,
];

// Quick lookup maps for performance
const _libraryByName = new Map<string, AILibrary>();
const _libraryByAlias = new Map<string, AILibrary>();

// Build lookup maps
for (const lib of ALL_LIBRARIES) {
    _libraryByName.set(lib.name.toLowerCase(), lib);
    for (const alias of lib.aliases) {
        _libraryByAlias.set(alias.toLowerCase(), lib);
    }
}

/**
 * Find a library by exact name
 */
export function findLibraryByName(name: string): AILibrary | undefined {
    const lower = name.toLowerCase();
    return _libraryByName.get(lower) || _libraryByAlias.get(lower);
}

/**
 * Find all libraries matching a partial name
 */
export function findLibrariesByPartialName(partial: string): AILibrary[] {
    const lower = partial.toLowerCase();
    return ALL_LIBRARIES.filter(lib =>
        lib.name.toLowerCase().includes(lower) ||
        lib.aliases.some(alias => alias.toLowerCase().includes(lower))
    );
}

/**
 * Get all high-risk libraries (biometrics, surveillance, etc.)
 */
export function getHighRiskLibraries(): AILibrary[] {
    return ALL_LIBRARIES.filter(lib => lib.high_risk_flag === true);
}

/**
 * Get libraries by category
 */
export function getLibrariesByCategory(category: AICategory): AILibrary[] {
    return ALL_LIBRARIES.filter(lib =>
        lib.category === category ||
        lib.secondary_categories?.includes(category)
    );
}

/**
 * Get libraries by ecosystem
 */
export function getLibrariesByEcosystem(ecosystem: string): AILibrary[] {
    return ALL_LIBRARIES.filter(lib => lib.ecosystem === ecosystem);
}

/**
 * Check if a file path looks like a model file
 */
export function isModelFile(filePath: string): boolean {
    const lower = filePath.toLowerCase();

    // Check extensions
    for (const ext of MODEL_FILE_EXTENSIONS) {
        if (lower.endsWith(ext)) {
            return true;
        }
    }

    // Check patterns
    for (const pattern of MODEL_FILE_PATTERNS) {
        if (pattern.test(filePath)) {
            return true;
        }
    }

    return false;
}

// Statistics
export const LIBRARY_STATS = {
    total: ALL_LIBRARIES.length,
    python: ALL_LIBRARIES.filter(l => l.ecosystem === 'python').length,
    javascript: ALL_LIBRARIES.filter(l => l.ecosystem === 'javascript').length,
    rust: ALL_LIBRARIES.filter(l => l.ecosystem === 'rust').length,
    go: ALL_LIBRARIES.filter(l => l.ecosystem === 'go').length,
    high_risk: ALL_LIBRARIES.filter(l => l.high_risk_flag).length,
};
