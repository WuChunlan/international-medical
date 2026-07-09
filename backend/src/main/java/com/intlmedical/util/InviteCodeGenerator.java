package com.intlmedical.util;

import java.security.SecureRandom;
import java.util.function.Predicate;

public final class InviteCodeGenerator {

    private static final String ALLOWED = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
    private static final int LENGTH = 8;
    private static final int MAX_RETRY = 20;
    private static final SecureRandom RANDOM = new SecureRandom();

    private InviteCodeGenerator() {}

    public static String generate() {
        StringBuilder sb = new StringBuilder(LENGTH);
        for (int i = 0; i < LENGTH; i++) {
            sb.append(ALLOWED.charAt(RANDOM.nextInt(ALLOWED.length())));
        }
        return sb.toString();
    }

    /** exists.test(code) 返回 true 表示该码已被占用，需要重试。 */
    public static String generateUnique(Predicate<String> exists) {
        for (int i = 0; i < MAX_RETRY; i++) {
            String code = generate();
            if (!exists.test(code)) {
                return code;
            }
        }
        throw new RuntimeException("邀请码生成失败：多次冲突");
    }
}
