import { render, screen, fireEvent } from "@testing-library/react";
import { FormValidationSummary } from "../FormValidationSummary";

describe("FormValidationSummary", () => {
  it("renders nothing when errors is empty", () => {
    const { container } = render(<FormValidationSummary errors={{}} />);
    expect(container.firstChild).toBeNull();
  });

  it("renders nothing when all errors are falsy", () => {
    const { container } = render(
      <FormValidationSummary errors={{ title: "", goal: undefined as unknown as string }} />,
    );
    expect(container.firstChild).toBeNull();
  });

  it("renders heading and all error messages", () => {
    render(
      <FormValidationSummary
        errors={{ title: "Title is required.", goal: "Must be a number." }}
      />,
    );
    expect(screen.getByText("Please fix the following errors:")).toBeInTheDocument();
    expect(screen.getByText("Title is required.")).toBeInTheDocument();
    expect(screen.getByText("Must be a number.")).toBeInTheDocument();
  });

  it("calls onFieldClick with the field name when a link is clicked", () => {
    const onFieldClick = jest.fn();
    render(
      <FormValidationSummary
        errors={{ title: "Title is required." }}
        onFieldClick={onFieldClick}
      />,
    );
    fireEvent.click(screen.getByText("Title is required."));
    expect(onFieldClick).toHaveBeenCalledWith("title");
  });

  it("has role=alert and aria-live=assertive", () => {
    const { container } = render(
      <FormValidationSummary errors={{ title: "Error" }} />,
    );
    const el = container.querySelector('[role="alert"]');
    expect(el).toBeInTheDocument();
    expect(el).toHaveAttribute("aria-live", "assertive");
  });

  it("renders a custom heading", () => {
    render(
      <FormValidationSummary errors={{ x: "Oops" }} heading="Fix these:" />,
    );
    expect(screen.getByText("Fix these:")).toBeInTheDocument();
  });
});
