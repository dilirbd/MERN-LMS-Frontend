/**
 * @type {import("stylelint").Config}
 */
const stylelintConfig = {
    extends: [
        "stylelint-config-standard",
        "@dreamsicle.io/stylelint-config-tailwindcss",
        "stylelint-config-clean-order"
    ],
    rules: {
        "no-descending-specificity": true,
    },
    ignoreFiles: [
        "**/node_modules/**",
        "**/dist/**",
        "**/build/**",
        "**/.next/**",
        "**/out/**"
    ],
};

export default stylelintConfig;