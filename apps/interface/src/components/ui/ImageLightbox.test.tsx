import { render, screen, fireEvent } from "@testing-library/react";
import { ImageLightbox, MediaGallery, LightboxImage } from "../ImageLightbox";

const images: LightboxImage[] = [
  { thumb: "/thumb1.jpg", hiRes: "/hi1.jpg", alt: "Photo one" },
  { thumb: "/thumb2.jpg", hiRes: "/hi2.jpg", alt: "Photo two" },
  { thumb: "/thumb3.jpg", hiRes: "/hi3.jpg", alt: "Photo three" },
];

describe("ImageLightbox", () => {
  it("renders dialog with correct aria attributes", () => {
    render(<ImageLightbox images={images} initialIndex={0} onClose={jest.fn()} />);
    const dialog = screen.getByRole("dialog");
    expect(dialog).toHaveAttribute("aria-modal", "true");
    expect(dialog).toHaveAttribute("aria-label", "Image lightbox");
  });

  it("shows alt text and counter", () => {
    render(<ImageLightbox images={images} initialIndex={0} onClose={jest.fn()} />);
    expect(screen.getByText(/Photo one/)).toBeInTheDocument();
    expect(screen.getByText(/1 \/ 3/)).toBeInTheDocument();
  });

  it("calls onClose when Escape is pressed", () => {
    const onClose = jest.fn();
    render(<ImageLightbox images={images} initialIndex={0} onClose={onClose} />);
    fireEvent.keyDown(document, { key: "Escape" });
    expect(onClose).toHaveBeenCalled();
  });

  it("navigates to next image on ArrowRight", () => {
    render(<ImageLightbox images={images} initialIndex={0} onClose={jest.fn()} />);
    fireEvent.keyDown(document, { key: "ArrowRight" });
    expect(screen.getByText(/Photo two/)).toBeInTheDocument();
  });

  it("navigates to prev image on ArrowLeft (wraps around)", () => {
    render(<ImageLightbox images={images} initialIndex={0} onClose={jest.fn()} />);
    fireEvent.keyDown(document, { key: "ArrowLeft" });
    expect(screen.getByText(/Photo three/)).toBeInTheDocument();
  });

  it("renders prev/next buttons with correct aria-labels", () => {
    render(<ImageLightbox images={images} initialIndex={1} onClose={jest.fn()} />);
    expect(screen.getByLabelText("Previous image")).toBeInTheDocument();
    expect(screen.getByLabelText("Next image")).toBeInTheDocument();
  });

  it("calls onClose when clicking outside the image area", () => {
    const onClose = jest.fn();
    render(<ImageLightbox images={images} initialIndex={0} onClose={onClose} />);
    fireEvent.click(screen.getByRole("dialog"));
    expect(onClose).toHaveBeenCalled();
  });

  it("renders nothing when images array is empty", () => {
    const { container } = render(
      <ImageLightbox images={[]} onClose={jest.fn()} />,
    );
    expect(container.firstChild).toBeNull();
  });
});

describe("MediaGallery", () => {
  it("renders thumbnail buttons", () => {
    render(<MediaGallery images={images} />);
    expect(screen.getByLabelText("Open Photo one in lightbox")).toBeInTheDocument();
  });

  it("opens lightbox when thumbnail is clicked", () => {
    render(<MediaGallery images={images} />);
    fireEvent.click(screen.getByLabelText("Open Photo one in lightbox"));
    expect(screen.getByRole("dialog")).toBeInTheDocument();
  });

  it("renders nothing when images array is empty", () => {
    const { container } = render(<MediaGallery images={[]} />);
    expect(container.firstChild).toBeNull();
  });
});
