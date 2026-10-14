import { router } from "expo-router";
import { useState } from "react";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

import { copy } from "@/src/i18n/strings";
import { useAccount, type Signup } from "@/src/state/account";
import { Frame } from "@/src/ui/frame";
import {
  ink,
  line,
  roast,
  sans,
  sansMedium,
  serif,
  serifItalic,
  smoke,
} from "@/src/ui/theme";

type Field = keyof Signup;

const EMPTY: Signup = { phone: "", email: "", name: "", idNumber: "" };

function errorsFor(signup: Signup): Partial<Record<Field, string>> {
  const errors: Partial<Record<Field, string>> = {};
  if (!/^3\d{9}$/.test(signup.phone.trim()))
    errors.phone = copy.signup.phoneError;
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(signup.email.trim()))
    errors.email = copy.signup.emailError;
  if (signup.name.trim().length < 2) errors.name = copy.signup.nameError;
  if (!/^\d{6,10}$/.test(signup.idNumber.trim()))
    errors.idNumber = copy.signup.idError;
  return errors;
}

export default function SignupScreen() {
  const { signUp } = useAccount();
  const [signup, setSignup] = useState<Signup>(EMPTY);
  const [errors, setErrors] = useState<Partial<Record<Field, string>>>({});

  const setField = (field: Field, value: string) => {
    setSignup((previous) => ({ ...previous, [field]: value }));
  };

  const submit = () => {
    const found = errorsFor(signup);
    setErrors(found);
    if (Object.keys(found).length > 0) return;
    signUp(signup);
    router.replace("/(tabs)/home");
  };

  return (
    <Frame>
      <ScrollView
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={styles.kicker}>{copy.signup.kicker}</Text>
        <Text style={styles.title}>{copy.signup.title}</Text>
        <Text style={styles.lead}>{copy.signup.lead}</Text>
        <Field
          label={copy.signup.phone}
          value={signup.phone}
          error={errors.phone}
          keyboard="phone-pad"
          id="signup-phone"
          onChange={(value) => setField("phone", value)}
        />
        <Field
          label={copy.signup.email}
          value={signup.email}
          error={errors.email}
          keyboard="email-address"
          id="signup-email"
          onChange={(value) => setField("email", value)}
        />
        <Field
          label={copy.signup.name}
          value={signup.name}
          error={errors.name}
          keyboard="default"
          id="signup-name"
          onChange={(value) => setField("name", value)}
        />
        <Field
          label={copy.signup.idNumber}
          value={signup.idNumber}
          error={errors.idNumber}
          keyboard="number-pad"
          id="signup-id"
          onChange={(value) => setField("idNumber", value)}
        />
        <Pressable
          onPress={submit}
          style={styles.button}
          accessibilityRole="button"
          testID="signup-enter"
        >
          <Text style={styles.buttonText}>{copy.signup.submit}</Text>
        </Pressable>
        <Text style={styles.foot}>{copy.signup.footnote}</Text>
      </ScrollView>
    </Frame>
  );
}

function Field({
  label,
  value,
  error,
  keyboard,
  id,
  onChange,
}: {
  label: string;
  value: string;
  error?: string;
  keyboard: "default" | "email-address" | "phone-pad" | "number-pad";
  id: string;
  onChange: (value: string) => void;
}) {
  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        value={value}
        onChangeText={onChange}
        keyboardType={keyboard}
        autoCapitalize={keyboard === "email-address" ? "none" : "words"}
        autoCorrect={false}
        style={styles.input}
        testID={id}
        accessibilityLabel={label}
      />
      {error ? <Text style={styles.error}>{error}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  scroll: {
    paddingHorizontal: 24,
    paddingTop: 28,
    paddingBottom: 48,
  },
  kicker: {
    fontFamily: sansMedium,
    letterSpacing: 1.5,
    textTransform: "uppercase",
    color: smoke,
    fontSize: 12,
  },
  title: {
    fontFamily: serif,
    fontSize: 46,
    color: ink,
    marginTop: 6,
  },
  lead: {
    fontFamily: serifItalic,
    fontSize: 18,
    lineHeight: 26,
    color: ink,
    marginTop: 8,
    marginBottom: 22,
  },
  field: {
    marginBottom: 16,
  },
  label: {
    fontFamily: sansMedium,
    fontSize: 13,
    color: smoke,
    marginBottom: 6,
  },
  input: {
    fontFamily: sans,
    fontSize: 18,
    color: ink,
    borderBottomWidth: 1,
    borderBottomColor: line,
    paddingVertical: 8,
  },
  error: {
    fontFamily: sans,
    color: roast,
    marginTop: 6,
    fontSize: 13,
  },
  button: {
    marginTop: 12,
    backgroundColor: ink,
    borderRadius: 28,
    paddingVertical: 16,
    alignItems: "center",
  },
  buttonText: {
    fontFamily: sansMedium,
    color: "#fff",
    fontSize: 16,
  },
  foot: {
    fontFamily: sans,
    color: smoke,
    fontSize: 13,
    lineHeight: 18,
    marginTop: 16,
  },
});
