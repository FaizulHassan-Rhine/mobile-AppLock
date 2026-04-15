import React, { useCallback, useMemo, useState } from 'react';
import { Pressable, Text, View } from 'react-native';

export type MathQuestionData = {
  prompt: string;
  answer: number;
  options: number[];
};

function randomInt(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function generateQuestion(): MathQuestionData {
  const op = randomInt(0, 2);
  let a: number;
  let b: number;
  let answer: number;
  let prompt: string;

  if (op === 0) {
    a = randomInt(5, 25);
    b = randomInt(5, 25);
    answer = a + b;
    prompt = `${a} + ${b} = ?`;
  } else if (op === 1) {
    a = randomInt(12, 30);
    b = randomInt(1, 11);
    answer = a - b;
    prompt = `${a} − ${b} = ?`;
  } else {
    a = randomInt(2, 9);
    b = randomInt(2, 9);
    answer = a * b;
    prompt = `${a} × ${b} = ?`;
  }

  const wrong = new Set<number>();
  while (wrong.size < 3) {
    const delta = randomInt(-8, 8);
    const w = answer + (delta === 0 ? randomInt(1, 5) : delta);
    if (w !== answer && w >= 0) {
      wrong.add(w);
    }
  }
  const options = [answer, ...Array.from(wrong)].sort(() => Math.random() - 0.5);
  return { prompt, answer, options };
}

type Props = {
  onCorrect: () => void;
  onWrong: () => void;
};

export default function MathQuestion({ onCorrect, onWrong }: Props) {
  const [data, setData] = useState(() => generateQuestion());
  const [errorBangla, setErrorBangla] = useState(false);

  const handlePick = useCallback(
    (value: number) => {
      if (value === data.answer) {
        onCorrect();
      } else {
        setErrorBangla(true);
        onWrong();
        setData(generateQuestion());
      }
    },
    [data.answer, onCorrect, onWrong],
  );

  const rows = useMemo(() => {
    const [c1, c2, c3, c4] = data.options;
    return [
      [c1, c2],
      [c3, c4],
    ];
  }, [data.options]);

  return (
    <View className="w-full">
      <Text className="text-center text-3xl font-bold text-white mb-6">
        {data.prompt}
      </Text>
      {errorBangla ? (
        <Text className="text-center text-amber-400 mb-4 text-lg px-2">
          ভুল হয়েছে! আবার চেষ্টা করো
        </Text>
      ) : null}
      <View className="gap-3">
        {rows.map((row, i) => (
          <View key={i} className="flex-row gap-3 justify-center">
            {row.map(num => (
              <Pressable
                key={`${i}-${num}`}
                onPress={() => handlePick(num)}
                className="flex-1 max-w-[48%] bg-focus-primary/90 active:bg-focus-primary py-4 rounded-2xl border border-violet-400/40">
                <Text className="text-center text-xl font-semibold text-white">
                  {num}
                </Text>
              </Pressable>
            ))}
          </View>
        ))}
      </View>
    </View>
  );
}
